'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

type SearchResult = {
  results: any[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
};

type SearchResponse = {
  users: SearchResult;
  projects: SearchResult;
  collections: SearchResult;
  query: string;
  type: string;
  page: number;
  limit: number;
  sortBy: string;
};

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const [query, setQuery] = useState(searchParams?.get('q') || '');
  const [activeTab, setActiveTab] = useState(searchParams?.get('type') || 'all');
  const [sortBy, setSortBy] = useState(searchParams?.get('sortBy') || 'relevance');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [results, setResults] = useState<SearchResponse>({
    users: { results: [], total: 0, page: 1, totalPages: 0, hasMore: false },
    projects: { results: [], total: 0, page: 1, totalPages: 0, hasMore: false },
    collections: { results: [], total: 0, page: 1, totalPages: 0, hasMore: false },
    query: '',
    type: 'all',
    page: 1,
    limit: 10,
    sortBy: 'relevance'
  });

  // Fetch search results when search params change
  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams({
          q: query,
          type: activeTab,
          page: '1',
          sortBy,
        });
        
        const response = await fetch(`/api/search?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch search results');
        }
        
        const data = await response.json();
        setResults(data);
      } catch (err) {
        console.error('Search error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    const timeoutId = setTimeout(fetchResults, 500);
    return () => clearTimeout(timeoutId);
  }, [query, activeTab, sortBy]);

  // Update URL when search state changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (query) params.set('q', query);
    if (activeTab !== 'all') params.set('type', activeTab);
    if (sortBy !== 'relevance') params.set('sortBy', sortBy);
    
    router.replace(`${pathname}?${params.toString()}`);
  }, [query, activeTab, sortBy, pathname, router, searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    // The useEffect will handle the actual search
  };

  const clearSearch = () => {
    setQuery('');
    setActiveTab('all');
    setSortBy('relevance');
  };

  const loadMore = async () => {
    if (isLoading) return;
    
    const currentTab = activeTab as keyof typeof results;
    const nextPage = (results[currentTab] as SearchResult).page + 1;
    
    try {
      setIsLoading(true);
      
      const params = new URLSearchParams({
        q: query,
        type: activeTab,
        page: nextPage.toString(),
        sortBy,
      });
      
      const response = await fetch(`/api/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to load more results');
      }
      
      const data = await response.json();
      
      setResults(prev => ({
        ...prev,
        [activeTab]: {
          ...data[activeTab as keyof typeof data],
          results: [
            ...(prev[currentTab] as SearchResult).results,
            ...(data[currentTab] as SearchResult).results,
          ],
        },
      }));
    } catch (err) {
      console.error('Error loading more results:', err);
      setError(err instanceof Error ? err.message : 'Failed to load more results');
    } finally {
      setIsLoading(false);
    }
  };

  const currentResults = results[activeTab as keyof typeof results] as SearchResult;
  const hasResults = currentResults.results.length > 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for users, projects, or collections..."
              className="pl-10 pr-10 py-6 text-base"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={clearSearch}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
          </div>
        </form>

        {query ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {currentResults.total} {currentResults.total === 1 ? 'result' : 'results'} for "{query}"
              </h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-background border rounded-md px-3 py-1 text-sm"
                >
                  <option value="relevance">Most Relevant</option>
                  <option value="recent">Most Recent</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>
            </div>

            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="users">Users ({results.users.total})</TabsTrigger>
                <TabsTrigger value="projects">Projects ({results.projects.total})</TabsTrigger>
                <TabsTrigger value="collections">Collections ({results.collections.total})</TabsTrigger>
              </TabsList>

              {error && (
                <div className="bg-destructive/15 text-destructive p-4 rounded-md mb-6">
                  <p>{error}</p>
                </div>
              )}

              <TabsContent value="all" className="space-y-4">
                {renderResults('all')}
              </TabsContent>
              
              <TabsContent value="users" className="space-y-4">
                {renderResults('users')}
              </TabsContent>
              
              <TabsContent value="projects" className="space-y-4">
                {renderResults('projects')}
              </TabsContent>
              
              <TabsContent value="collections" className="space-y-4">
                {renderResults('collections')}
              </TabsContent>
            </Tabs>

            {isLoading && (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {!isLoading && hasResults && currentResults.hasMore && (
              <div className="flex justify-center mt-8">
                <Button 
                  onClick={loadMore} 
                  disabled={isLoading}
                  variant="outline"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}

            {!isLoading && !hasResults && query && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No {activeTab === 'all' ? 'results' : activeTab} found for "{query}"
                </p>
                <Button variant="link" onClick={clearSearch} className="mt-2">
                  Clear search
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Search for users, projects, or collections</h3>
            <p className="text-muted-foreground">
              Try searching for something like "web development" or "machine learning"
            </p>
          </div>
        )}
      </div>
    </div>
  );

  function renderResults(type: string) {
    const resultData = results[type as keyof typeof results] as SearchResult;
    
    if (type === 'all') {
      return (
        <>
          {results.users.results.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Users ({results.users.total})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.users.results.slice(0, 4).map(renderUserCard)}
              </div>
              {results.users.total > 4 && (
                <div className="mt-4 text-right">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setActiveTab('users')}
                  >
                    View all {results.users.total} users →
                  </Button>
                </div>
              )}
            </div>
          )}

          {results.projects.results.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Projects ({results.projects.total})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.projects.results.slice(0, 4).map(renderProjectCard)}
              </div>
              {results.projects.total > 4 && (
                <div className="mt-4 text-right">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setActiveTab('projects')}
                  >
                    View all {results.projects.total} projects →
                  </Button>
                </div>
              )}
            </div>
          )}

          {results.collections.results.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Collections ({results.collections.total})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.collections.results.slice(0, 4).map(renderCollectionCard)}
              </div>
              {results.collections.total > 4 && (
                <div className="mt-4 text-right">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setActiveTab('collections')}
                  >
                    View all {results.collections.total} collections →
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      );
    }

    if (type === 'users') {
      return resultData.results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resultData.results.map(renderUserCard)}
        </div>
      ) : null;
    }

    if (type === 'projects') {
      return resultData.results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resultData.results.map(renderProjectCard)}
        </div>
      ) : null;
    }

    if (type === 'collections') {
      return resultData.results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resultData.results.map(renderCollectionCard)}
        </div>
      ) : null;
    }

    return null;
  }

  function renderUserCard(user: any) {
    return (
      <Link key={user._id} href={`/profile/${user._id}`}>
        <Card className="hover:bg-accent/50 transition-colors h-full">
          <CardContent className="flex items-center p-4">
            <Avatar className="h-12 w-12 mr-4">
              <AvatarImage src={user.photo} alt={user.fullName} />
              <AvatarFallback>
                {user.fullName
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-medium">{user.fullName}</h4>
              <p className="text-sm text-muted-foreground">
                {user.profile?.position || 'Student'}
                {user.profile?.department && ` • ${user.profile.department}`}
              </p>
              {user.profile?.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {user.profile.skills.slice(0, 3).map((skill: string) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  function renderProjectCard(project: any) {
    return (
      <Link key={project._id || project.id} href={`/projects/${project._id || project.id}`}>
        <Card className="overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
          {project.images?.[0] ? (
            <div className="aspect-video relative bg-muted">
              <Image
                src={project.images[0]}
                alt={project.title}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="aspect-video bg-muted flex items-center justify-center">
              <span className="text-muted-foreground">No preview</span>
            </div>
          )}
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-lg">{project.title}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex-1">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {project.description}
            </p>
            {project.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {project.tags.slice(0, 3).map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="p-4 pt-0 flex justify-between items-center text-sm">
            <div className="flex items-center">
              <Avatar className="h-6 w-6 mr-2">
                <AvatarImage src={project.author?.image} alt={project.author?.name} />
                <AvatarFallback>
                  {project.author?.name
                    ?.split(' ')
                    .map((n: string) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <span className="text-muted-foreground">{project.author?.name}</span>
            </div>
            <div className="flex items-center space-x-2 text-muted-foreground">
              <span className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-1"
                >
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
                {project.likeCount || 0}
              </span>
            </div>
          </CardFooter>
        </Card>
      </Link>
    );
  }

  function renderCollectionCard(collection: any) {
    return (
      <Link key={collection.id} href={`/collections/${collection.slug || collection.id}`}>
        <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-lg">{collection.name}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {collection.description || 'A collection of related projects and resources.'}
            </p>
            <div className="flex flex-wrap gap-1 mt-3">
              <Badge variant="outline" className="text-xs">
                {collection.projects?.length || 0} projects
              </Badge>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8"><div className="max-w-3xl mx-auto text-center py-12">Loading...</div></div>}>
      <SearchPageContent />
    </Suspense>
  );
}
