import { error } from '@sveltejs/kit';
import { PUBLIC_BACK_URL } from '$env/static/public';
import type { RequestHandler } from './$types';

/**
 * Convert SRT subtitle format to WebVTT format
 * VideoJS works much better with WebVTT than SRT
 */
function convertSrtToWebVtt(srtContent: string): string {
	// Add WebVTT header
	let webvtt = 'WEBVTT\n\n';
	
	// Split by subtitle blocks (double newlines)
	const blocks = srtContent.split(/\n\s*\n/);
	
	for (const block of blocks) {
		const lines = block.trim().split('\n');
		if (lines.length < 3) continue; // Skip invalid blocks
		
		// Skip the subtitle number (first line)
		const timeLine = lines[1];
		const textLines = lines.slice(2);
		
		// Convert SRT timestamp format to WebVTT format
		// SRT: 00:00:01,000 --> 00:00:04,000
		// WebVTT: 00:00:01.000 --> 00:00:04.000
		const webvttTimeLine = timeLine.replace(/,/g, '.');
		
		// Add the cue to WebVTT
		webvtt += webvttTimeLine + '\n';
		webvtt += textLines.join('\n') + '\n\n';
	}
	
	return webvtt;
}

export const GET: RequestHandler = async ({ params, request, cookies, url }) => {
	const { movieId, language } = params;
	
	// Get authentication token from multiple sources
	const authHeader = request.headers.get('authorization');
	const cookieToken = cookies.get('auth_token');
	const queryToken = url.searchParams.get('token');
	const token = authHeader?.replace('Bearer ', '') || queryToken || cookieToken;
	
	if (!token) {
		throw error(401, 'Authentication required');
	}
	
	try {
		// Proxy request to backend with authentication
		const backendUrl = `${PUBLIC_BACK_URL}/movies/${movieId}/subtitles/${language}`;
		
		const response = await fetch(backendUrl, {
			headers: {
				'Authorization': `Bearer ${token}`
			}
		});
		
		if (!response.ok) {
			if (response.status === 401) {
				throw error(401, 'Authentication failed');
			}
			if (response.status === 404) {
				throw error(404, 'Subtitle not found');
			}
			throw error(response.status, 'Subtitle request failed');
		}
		
		// Get the subtitle content and convert SRT to WebVTT
		const subtitleContent = await response.text();
		const webVttContent = convertSrtToWebVtt(subtitleContent);
		
		// Return as WebVTT format
		return new Response(webVttContent, {
			headers: {
				'Content-Type': 'text/vtt; charset=utf-8',
				'Cache-Control': 'public, max-age=3600',
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET',
				'Access-Control-Allow-Headers': 'Content-Type'
			}
		});
		
	} catch (err) {
		console.error('Subtitle proxy error:', err);
		
		if (err instanceof Error && 'status' in err) {
			throw err; // Re-throw SvelteKit errors
		}
		throw error(500, 'Failed to fetch subtitle');
	}
};
