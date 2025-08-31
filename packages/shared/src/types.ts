export type BackDropImage = {
  url: string;
  aspect_ratio: number;
  height: number;
  iso_639_1: string;
  file_path: string;
  vote_average: number;
  vote_count: number;
  width: number;
  langFound: boolean;
};

export type ImageSizeType = 'small' | 'medium' | 'large' | 'original';
export type MovieType = 'movie' | 'tv';

export type Movie = {
  id: number;
  title: string;
  name: string;
  overview: string;
  poster_path: string;
  release_date: string;
  vote_average: number;
  media_type: MovieType | undefined;
  backdrop_image: BackDropImage | null | undefined;
  is_watched?: boolean;
  is_bookmarked?: boolean;
};

export type Genre = {
  id: number;
  name: string;
};

export type MovieGenre = Genre & {
  movies: Movie[];
};

export type MovieDetails = {
  adult: boolean;
  backdrop_path: string | null;
  belongs_to_collection?: {
    id: number;
    name: string;
    poster_path: string | null;
    backdrop_path: string | null;
  };
  budget: number;
  genres: {
    id: number;
    name: string;
  }[];
  homepage: string | null;
  id: number;
  imdb_id: string | null;
  origin_country: string[];
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string | null;
  production_companies: {
    id: number;
    logo_path: string | null;
    name: string;
    origin_country: string;
  }[];
  production_countries: {
    iso_3166_1: string;
    name: string;
  }[];
  release_date: string;
  revenue: number;
  runtime: number | null;
  spoken_languages: {
    english_name: string;
    iso_639_1: string;
    name: string;
  }[];
  status: string;
  tagline: string;
  title: string;
  name: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
  // TV Show specific properties (optional)
  first_air_date?: string;
  last_air_date?: string;
  number_of_episodes?: number;
  number_of_seasons?: number;
  episode_run_time?: number[];
  in_production?: boolean;
  type?: string;
  created_by?: {
    id: number;
    credit_id: string;
    name: string;
    gender: number;
    profile_path: string | null;
  }[];
  networks?: {
    id: number;
    name: string;
    logo_path: string | null;
    origin_country: string;
  }[];
};

export type MovieVideo = {
  id: string;
  iso_639_1: string;
  iso_3166_1: string;
  key: string;
  name: string;
  site: string;
  size: number;
  type: string;
  official: boolean;
  published_at: string;
  updated_at: string;
};

export interface PaginationType<T> {
  meta: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
    firstPage: number;
    firstPageUrl: string;
    lastPageUrl: string;
    nextPageUrl: string | null;
    previousPageUrl: string | null;
  };
  data: T[];
}

export type CastMember = {
  id: number;
  adult: boolean;
  gender: number;
  known_for_department: string;
  name: string;
  original_name: string;
  popularity: number;
  profile_path: string;
  cast_id: number;
  character: string;
  credit_id: string;
  order: number;
};

export type CrewMember = {
  id: number;
  adult: boolean;
  gender: number;
  known_for_department: string;
  name: string;
  original_name: string;
  popularity: number;
  profile_path: string;
  credit_id: string;
  department: string;
  job: string;
};

export type MovieCredits = {
  id: number;
  cast: CastMember[];
  crew: CrewMember[];
};

export type PersonDetails = {
  adult: boolean;
  also_known_as: string[];
  biography: string;
  birthday: string;
  deathday: string;
  gender: number;
  homepage: string;
  id: number;
  imdb_id: string;
  known_for_department: string;
  name: string;
  place_of_birth: string;
  popularity: number;
  profile_path: string;
};

export type SubtitleApiResponse = {
  total_pages: number;
  total_count: number;
  per_page: number;
  page: number;
  data: SubtitleResult[];
};

export type SubtitleResult = {
  id: string;
  type: 'subtitle';
  attributes: {
    subtitle_id: string;
    language: string;
    download_count: number;
    new_download_count: number;
    hearing_impaired: boolean;
    hd: boolean;
    fps: number;
    votes: number;
    ratings: number;
    from_trusted: boolean;
    foreign_parts_only: boolean;
    upload_date: string;
    ai_translated: boolean;
    nb_cd: number;
    slug: string;
    machine_translated: boolean;
    release: string;
    comments: string;
    legacy_subtitle_id: number;
    legacy_uploader_id: number;
    uploader: {
      uploader_id: number | null;
      name: string;
      rank: string;
    };
    feature_details: {
      feature_id: number;
      feature_type: string;
      year: number;
      title: string;
      movie_name: string;
      imdb_id: number;
      tmdb_id: number;
    };
    url: string;
    related_links: {
      label: string;
      url: string;
      img_url: string;
    }[];
    files: {
      file_id: number;
      cd_number: number;
      file_name: string;
    };
  };
};

export type SubtitleDownloadRequest = {
  file_id: number;
  sub_format?: string;
  file_name?: string;
  in_fps?: number;
  out_fps?: number;
  timeshift?: number;
  force_download?: boolean;
};

export type SubtitleDownloadResponse = {
  link: string;
  file_name: string;
  requests: number;
  remaining: number;
  message: string;
  reset_time: string;
  reset_time_utc: string;
};
