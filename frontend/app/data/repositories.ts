export type GitHubRepositoryOwner = {
  login: string;
};

export type GitHubRepository = {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  updated_at: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  owner: GitHubRepositoryOwner;
};
