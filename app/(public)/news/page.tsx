import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { serverSupabase } from '@/lib/supabase-server';
import { formatDate } from '@/lib/utils';
import { Newspaper, Calendar, Tag, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'News',
  description: 'NexCade announcements, event recaps, and gaming news from arcades across South Africa.',
};

const CATEGORY_COLORS: Record<string, string> = {
  Announcement: 'bg-red-600/20 text-red-400 border-red-600/30',
  Recap:        'bg-blue-600/20 text-blue-400 border-blue-600/30',
  Community:    'bg-green-600/20 text-green-400 border-green-600/30',
  News:         'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
};

const CATEGORY_DOT: Record<string, string> = {
  Announcement: 'bg-red-500',
  Recap:        'bg-blue-500',
  Community:    'bg-green-500',
  News:         'bg-yellow-500',
};

type Params = Promise<Record<string, string>>;
type SearchParams = Promise<{ category?: string }>;

export default async function NewsPage({
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { category } = await searchParams;

  const base = serverSupabase
    .from('news_posts')
    .select('id, title, slug, excerpt, category, cover_image_url, published_at, profiles(full_name, gamer_tag)')
    .eq('is_published', true)
    .order('published_at', { ascending: false });

  const { data } = await (category ? base.eq('category', category) : base);
  const posts = data ?? [];

  // Distinct categories from all published posts (for filter tabs)
  const { data: allPosts } = await serverSupabase
    .from('news_posts')
    .select('category')
    .eq('is_published', true)
    .not('category', 'is', null);

  const categories = [...new Set((allPosts ?? []).map((p) => p.category).filter(Boolean))] as string[];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* Header */}
      <div className="flex items-center gap-3 mb-10">
        <Newspaper className="w-7 h-7 text-red-500" />
        <div>
          <h1 className="font-display text-5xl text-white leading-none">NEWS</h1>
          <p className="text-zinc-400 text-sm mt-0.5">Announcements, recaps &amp; gaming updates</p>
        </div>
      </div>

      {/* Category filter */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            href="/news"
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
              !category
                ? 'bg-white text-zinc-900 border-white'
                : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-white'
            }`}
          >
            All
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/news?category=${encodeURIComponent(cat)}`}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                category === cat
                  ? 'bg-white text-zinc-900 border-white'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-white'
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>
      )}

      {posts.length === 0 ? (
        <div className="text-center py-24 text-zinc-500">
          <Newspaper className="w-12 h-12 mx-auto mb-4 text-zinc-700" />
          <p className="text-lg">No posts yet.</p>
        </div>
      ) : (
        <>
          {/* Featured post (first) */}
          {!category && posts[0] && (
            <FeaturedPost post={posts[0]} />
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
            {(category ? posts : posts.slice(1)).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  profiles: unknown;
};

function authorName(profiles: unknown): string {
  const p = profiles as { full_name?: string; gamer_tag?: string } | null;
  return p?.full_name ?? p?.gamer_tag ?? 'NexCade';
}

function FeaturedPost({ post }: { post: Post }) {
  const cat = post.category ?? 'News';
  const colorClass = CATEGORY_COLORS[cat] ?? 'bg-zinc-700/20 text-zinc-400 border-zinc-700';
  const dotClass = CATEGORY_DOT[cat] ?? 'bg-zinc-500';

  return (
    <Link
      href={`/news/${post.slug}`}
      className="group block bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-600 transition-all hover:shadow-lg hover:shadow-red-600/5 mb-2"
    >
      {post.cover_image_url ? (
        <div className="relative h-72 w-full overflow-hidden">
          <Image
            src={post.cover_image_url}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <CategoryBadge cat={cat} colorClass={colorClass} dotClass={dotClass} />
            <h2 className="font-display text-3xl text-white mt-2 group-hover:text-red-400 transition-colors leading-snug">
              {post.title}
            </h2>
            {post.excerpt && (
              <p className="text-zinc-300 text-sm mt-1 line-clamp-2">{post.excerpt}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="p-8">
          <CategoryBadge cat={cat} colorClass={colorClass} dotClass={dotClass} />
          <h2 className="font-display text-4xl text-white mt-3 group-hover:text-red-400 transition-colors">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="text-zinc-300 text-base mt-3 leading-relaxed line-clamp-3">{post.excerpt}</p>
          )}
        </div>
      )}

      <div className="px-8 py-4 border-t border-zinc-800 flex items-center justify-between text-sm text-zinc-500">
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {post.published_at ? formatDate(post.published_at, 'long') : '—'}
        </span>
        <span className="flex items-center gap-1 text-zinc-400 group-hover:text-white transition-colors">
          Read more <ChevronRight className="w-4 h-4" />
        </span>
      </div>
    </Link>
  );
}

function PostCard({ post }: { post: Post }) {
  const cat = post.category ?? 'News';
  const colorClass = CATEGORY_COLORS[cat] ?? 'bg-zinc-700/20 text-zinc-400 border-zinc-700';
  const dotClass = CATEGORY_DOT[cat] ?? 'bg-zinc-500';

  return (
    <Link
      href={`/news/${post.slug}`}
      className="group bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-600 hover:shadow-lg hover:shadow-red-600/5 transition-all flex flex-col"
    >
      {post.cover_image_url && (
        <div className="relative h-44 overflow-hidden">
          <Image
            src={post.cover_image_url}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}
      <div className="p-5 flex flex-col gap-3 flex-1">
        <CategoryBadge cat={cat} colorClass={colorClass} dotClass={dotClass} />
        <h3 className="text-white font-bold text-base group-hover:text-red-400 transition-colors line-clamp-3 leading-snug">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-zinc-500 text-sm line-clamp-2 leading-relaxed">{post.excerpt}</p>
        )}
        <div className="mt-auto flex items-center justify-between text-xs text-zinc-600 pt-3 border-t border-zinc-800">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3" />
            {post.published_at ? formatDate(post.published_at, 'short') : '—'}
          </span>
          <span className="text-zinc-500">{authorName(post.profiles)}</span>
        </div>
      </div>
    </Link>
  );
}

function CategoryBadge({ cat, colorClass, dotClass }: { cat: string; colorClass: string; dotClass: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${colorClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
      {cat}
    </span>
  );
}
