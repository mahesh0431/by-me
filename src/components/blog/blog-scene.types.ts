export interface BlogScenePost {
  description: string;
  pubDateIso: string;
  pubDateLabel: string;
  slug: string;
  tags: string[];
  title: string;
  updatedDateIso?: string;
  updatedDateLabel?: string;
  url: string;
}

export interface BlogSceneYearGroup {
  posts: BlogScenePost[];
  year: number;
}
