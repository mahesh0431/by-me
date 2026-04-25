export interface BlogScenePost {
  createdIso: string;
  createdLabel: string;
  description: string;
  slug: string;
  tags: string[];
  title: string;
  updatedIso?: string;
  updatedLabel?: string;
  url: string;
}

export interface BlogSceneYearGroup {
  posts: BlogScenePost[];
  year: number;
}
