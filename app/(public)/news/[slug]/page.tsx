import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { serverSupabase } from '@/lib/supabase-server';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, Calendar, User, Tag, ChevronRight } from 'lucide-react';

type Params = Promise<{ slug: string }>;

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

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await serverSupabase
    .from('news_posts')
    .select('title, excerpt')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();
  if (!data) return { title: 'Post Not Found' };
  return {
    title: data.title,
    description: data.excerpt ?? undefined,
  };
}

export default async function NewsPostPage({ params }: { params: Params }) {
  const { slug } = await params;

  const { data: post } = await serverSupabase
    .from('news_posts')
    .select('id, title, slug, excerpt, content, category, cover_image_url, published_at, profiles(full_name, gamer_tag, avatar_url)')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (!post) notFound();

  const author = post.profiles as { full_name?: string; gamer_tag?: string; avatar_url?: string } | null;
  const authorDisplay = author?.full_name ?? author?.gamer_tag ?? 'NexCade';
  const cat = post.category ?? 'News';
  const colorClass = CATEGORY_COLORS[cat] ?? 'bg-zinc-700/20 text-zinc-400 border-zinc-700';
  const dotClass = CATEGORY_DOT[cat] ?? 'bg-zinc-500';

  // Related posts — same category, excluding this post
  const { data: relatedData } = await serverSupabase
    .from('news_posts')
    .select('id, title, slug, excerpt, category, cover_image_url, published_at')
    .eq('is_published', true)
    .eq('category', cat)
    .neq('slug', slug)
    .order('published_at', { ascending: false })
    .limit(3);

  const related = relatedData ?? [];

  // Fallback: if no related in same category, fetch latest posts
  const { data: latestData } = related.length === 0
    ? await serverSupabase
        .from('news_posts')
        .select('id, title, slug, excerpt, category, cover_image_url, published_at')
        .eq('is_published', true)
        .neq('slug', slug)
        .order('published_at', { ascending: false })
        .limit(3)
    : { data: null };

  const relatedPosts = related.length > 0 ? related : (latestData ?? []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Back */}
      <Link
        href="/news"
        className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> All News
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* ── MAIN ── */}
        <article className="lg:col-span-2">

          {/* Cover image */}
          {post.cover_image_url && (
            <div className="relative h-72 sm:h-96 w-full rounded-2xl overflow-hidden mb-8">
              <Image
                src={post.cover_image_url}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Category */}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${colorClass} mb-4`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
            {cat}
          </span>

          {/* Title */}
          <h1 className="font-display text-4xl sm:text-5xl text-white leading-tight mb-6">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500 mb-8 pb-8 border-b border-zinc-800">
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              {authorDisplay}
            </span>
            {post.published_at && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatDate(post.published_at, 'long')}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="text-zinc-300 leading-relaxed text-base whitespace-pre-line">
            {post.content}
          </div>
        </article>

        {/* ── SIDEBAR ── */}
        <aside className="flex flex-col gap-6">

          {/* Post info card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider">Post Info</h3>
            <div className="flex items-start gap-3 text-sm">
              <Tag className="w-4 h-4 text-zinc-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-zinc-500 text-xs">Category</p>
                <p className="text-zinc-200">{cat}</p>
              </div>
            </div>
            {post.published_at && (
              <div className="flex items-start gap-3 text-sm">
                <Calendar className="w-4 h-4 text-zinc-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-zinc-500 text-xs">Published</p>
                  <p className="text-zinc-200">{formatDate(post.published_at, 'long')}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3 text-sm">
              <User className="w-4 h-4 text-zinc-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-zinc-500 text-xs">Author</p>
                <p className="text-zinc-200">{authorDisplay}</p>
              </div>
            </div>
          </div>

          {/* All news CTA */}
          <Link
            href="/news"
            className="flex items-center justify-between px-5 py-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-600 transition-colors"
          >
            <span className="text-zinc-200 font-semibold text-sm">All news posts</span>
            <ChevronRight className="w-4 h-4 text-zinc-600" />
          </Link>

          {/* Browse by category */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Categories</h3>
            <div className="flex flex-col gap-2">
              {Object.keys(CATEGORY_COLORS).map((c) => (
                <Link
                  key={c}
                  href={`/news?category=${encodeURIComponent(c)}`}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-opacity hover:opacity-80 w-fit ${CATEGORY_COLORS[c]}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${CATEGORY_DOT[c]}`} />
                  {c}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Related posts */}
      {relatedPosts.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-3xl text-white mb-6">
            {related.length > 0 ? `MORE ${cat.toUpperCase()}` : 'MORE NEWS'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {relatedPosts.map((p) => {
              const pCat = p.category ?? 'News';
              const pColor = CATEGORY_COLORS[pCat] ?? 'bg-zinc-700/20 text-zinc-400 border-zinc-700';
              const pDot = CATEGORY_DOT[pCat] ?? 'bg-zinc-500';
              return (
                <Link
                  key={p.id}
                  href={`/news/${p.slug}`}
                  className="group bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-600 transition-all flex flex-col"
                >
                  {p.cover_image_url && (
                    <div className="relative h-36 overflow-hidden">
                      <Image src={p.cover_image_url} alt={p.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  )}
                  <div className="p-4 flex flex-col gap-2 flex-1">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold border w-fit ${pColor}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${pDot}`} />
                      {pCat}
                    </span>
                    <h3 className="text-white font-bold text-sm group-hover:text-red-400 transition-colors line-clamp-2 leading-snug">
                      {p.title}
                    </h3>
                    {p.excerpt && (
                      <p className="text-zinc-500 text-xs line-clamp-2">{p.excerpt}</p>
                    )}
                    <p className="text-zinc-600 text-xs mt-auto pt-2 border-t border-zinc-800">
                      {p.published_at ? formatDate(p.published_at, 'short') : '—'}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
