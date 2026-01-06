'use client';

import { Search } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Image from 'next/image';

type SearchResult = {
  _id: string;
  title?: string;
  name?: string;
  description?: string;
  image?: string;
  photo?: string;
  type: 'user' | 'project' | 'collection';
  tags?: string[];
  author?: {
    name: string;
    image?: string;
  };
  likeCount?: number;
};

type SearchResultsProps = {
  initialResults?: {
    users: SearchResult[];
    projects: SearchResult[];
    collections: SearchResult[];
  };
  query: string;
};

export function SearchResults({ initialResults, query }: SearchResultsProps) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState({
    users: initialResults?.users || [],
    projects: initialResults?.projects || [],
    collections: initialResults?.collections || [],
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const type = searchParams?.get('type') || 'all';
    setActiveTab(type);
  }, [searchParams]);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams({
          q: query,
          type: activeTab === 'all' ? 'all' : activeTab,
        });
        
        const response = await fetch(`/api/search?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch search results');
        }
        
        const data = await response.json();
        
        setResults({
          users: data.users?.results || [],
          projects: data.projects?.results || [],
          collections: data.collections?.results || [],
        });
      } catch (err) {
        console.error('Search error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchResults();
  }, [query, activeTab]);

  const renderResultItem = (result: SearchResult) => {
    if (result.type === 'user') {
      return (
        <Link key={result._id} href={`/profile/${result._id}`}>
          <Card className="hover:bg-accent/50 transition-colors h-full">
            <CardContent className="flex items-center p-4">
              <Avatar className="h-12 w-12 mr-4">
                <AvatarImage src={result.photo} alt={result.name} />
                <AvatarFallback>
                  {result.name?.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-medium">{result.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {result.tags?.[0] || 'User'}
                </p>
                {result.tags && result.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {result.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
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

    if (result.type === 'project') {
      return (
        <Link key={result._id} href={`/projects/${result._id}`}>
          <Card className="overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
            {result.image ? (
              <div className="aspect-video relative bg-muted">
                <Image
                  src={result.image}
                  alt={result.title || 'Project'}
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
              <CardTitle className="text-lg">{result.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-1">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {result.description}
              </p>
              {result.tags && result.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {result.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="p-4 pt-0 flex justify-between items-center text-sm">
              {result.author && (
                <div className="flex items-center">
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarImage src={result.author.image} alt={result.author.name} />
                    <AvatarFallback>
                      {result.author.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-muted-foreground">{result.author.name}</span>
                </div>
              )}
              {result.likeCount !== undefined && (
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
                    {result.likeCount}
                  </span>
                </div>
              )}
            </CardFooter>
          </Card>
        </Link>
      );
    }

    return (
      <Link key={result._id} href={`/collections/${result._id}`}>
        <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-lg">{result.title || 'Collection'}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {result.description || 'A collection of related projects and resources.'}
            </p>
            {result.tags && result.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {result.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    );
  };

  const renderLoadingSkeletons = (count: number) => {
    return Array(count)
      .fill(0)
      .map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ));
  };

  const allResults = [
    ...results.users.map(r => ({ ...r, type: 'user' as const })),
    ...results.projects.map(r => ({ ...r, type: 'project' as const })),
    ...results.collections.map(r => ({ ...r, type: 'collection' as const })),
  ];

  const hasResults = allResults.length > 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">
            Search results for "{query}"
          </h1>
          <p className="text-muted-foreground">
            Found {allResults.length} {allResults.length === 1 ? 'result' : 'results'}
          </p>
        </div>

        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="users">Users ({results.users.length})</TabsTrigger>
            <TabsTrigger value="projects">Projects ({results.projects.length})</TabsTrigger>
            <TabsTrigger value="collections">Collections ({results.collections.length})</TabsTrigger>
          </TabsList>

          {error && (
            <div className="bg-destructive/15 text-destructive p-4 rounded-md mb-6">
              <p>{error}</p>
            </div>
          )}

          <TabsContent value="all" className="space-y-4">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderLoadingSkeletons(4)}
              </div>
            ) : hasResults ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allResults.map(renderResultItem)}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No results found for "{query}"
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderLoadingSkeletons(4)}
              </div>
            ) : results.users.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.users.map(user => renderResultItem({ ...user, type: 'user' }))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No users found for "{query}"
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="projects" className="space-y-4">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderLoadingSkeletons(4)}
              </div>
            ) : results.projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.projects.map(project => renderResultItem({ ...project, type: 'project' }))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No projects found for "{query}"
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="collections" className="space-y-4">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderLoadingSkeletons(4)}
              </div>
            ) : results.collections.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.collections.map(collection => 
                  renderResultItem({ ...collection, type: 'collection' })
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No collections found for "{query}"
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
