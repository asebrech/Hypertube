/**
 * Subtitle format conversion utilities
 */

export function convertSrtToWebVtt(srtContent: string): string {
  let webvtt = 'WEBVTT\n\n'
  
  const blocks = srtContent.split(/\n\s*\n/)
  
  for (const block of blocks) {
    const lines = block.trim().split('\n')
    if (lines.length < 3) continue
    
    const timeLine = lines[1]
    const textLines = lines.slice(2)
    
    // Convert SRT timestamp format to WebVTT format
    const webvttTimeLine = timeLine.replace(/,/g, '.')
    
    webvtt += webvttTimeLine + '\n'
    webvtt += textLines.join('\n') + '\n\n'
  }
  
  return webvtt
}

export function isWebVttFormat(content: string): boolean {
  return content.trim().startsWith('WEBVTT')
}

export function getSubtitleContentType(format: 'srt' | 'vtt'): string {
  return format === 'vtt' ? 'text/vtt; charset=utf-8' : 'text/plain; charset=utf-8'
}
