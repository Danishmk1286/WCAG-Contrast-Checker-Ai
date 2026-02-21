import React, { useState, memo } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, User, ArrowRight, Sparkles, ChevronDown, Clock } from "lucide-react";

interface BlogCardProps {
  post: {
    id: string | number;
    title: string;
    slug: string;
    excerpt: string;
    author: string;
    date: string;
    readTime?: string;
    tags: string[];
    featuredImage?: {
      url?: string;
      alt?: string;
    };
  };
  variant?: "default" | "featured" | "compact";
}

const BlogCard: React.FC<BlogCardProps> = memo(({ post, variant = "default" }) => {
  const [showAllTags, setShowAllTags] = useState(false);
  const [isTitleHovered, setIsTitleHovered] = useState(false);
  const [isImageHovered, setIsImageHovered] = useState(false);
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  
  const formattedDate = post.date
    ? new Date(post.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "No date";

  const visibleTagsCount = 2;
  const hasMoreTags = post.tags.length > visibleTagsCount;
  const displayedTags = showAllTags ? post.tags : post.tags.slice(0, visibleTagsCount);
  const remainingCount = post.tags.length - visibleTagsCount;

  if (variant === "compact") {
    return (
      <article className="group relative h-full">
        <Link
          to={`/blog/${post.slug}`}
          className="flex flex-col h-full p-4 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card hover:border-primary/40 hover:shadow-lg transition-all duration-300"
        >
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2 flex-grow">
            {post.title}
          </h3>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto">
            <span>{formattedDate}</span>
          </div>
        </Link>
      </article>
    );
  }

  if (variant === "featured") {
    return (
      <article className="group relative">
        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-primary/5 shadow-sm hover:shadow-2xl hover:border-primary/50 transition-all duration-500">
          {/* Featured indicator */}
          <div className="absolute top-4 right-4 z-10">
            <Badge className="bg-primary/90 text-primary-foreground gap-1 shadow-lg">
              <Sparkles className="w-3 h-3" />
              Featured
            </Badge>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8">
            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <span className="font-medium text-foreground">{post.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                <time dateTime={post.date}>{formattedDate}</time>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4 leading-tight group-hover:text-primary transition-colors duration-300">
              <Link to={`/blog/${post.slug}`} className="block line-clamp-2">
                {post.title}
              </Link>
            </h2>

            {/* Excerpt */}
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-6 line-clamp-3 min-h-[4.5rem]">
              {post.excerpt}
            </p>

            {/* Tags and CTA */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {displayedTags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-xs px-3 py-1 bg-muted/80 hover:bg-muted transition-colors"
                  >
                    {tag}
                  </Badge>
                ))}
                {hasMoreTags && !showAllTags && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setShowAllTags(true);
                    }}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-border bg-background hover:bg-accent text-foreground font-medium transition-colors"
                  >
                    +{remainingCount}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                )}
              </div>
              <Link
                to={`/blog/${post.slug}`}
                className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all duration-300 group/link"
              >
                Read Article
                <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // Default variant - full-width horizontal card with enhanced hover effects
  const fullDate = post.date
    ? new Date(post.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "No date";

  const shortDate = post.date
    ? new Date(post.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "No date";

  const firstTag = post.tags && post.tags.length > 0 ? post.tags[0] : "Article";

  return (
    <article className="relative rounded-2xl border border-border/50 bg-card overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Image wrapper - left side on desktop */}
        <Link
          to={`/blog/${post.slug}`}
          className="relative w-full md:w-80 lg:w-[28rem] h-64 md:h-auto overflow-hidden bg-gradient-to-br from-muted to-muted/50 flex-shrink-0 block"
          onMouseEnter={() => {
            setIsImageHovered(true);
            // Prefetch the blog post page on hover
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = `/blog/${post.slug}`;
            document.head.appendChild(link);
          }}
          onMouseLeave={() => setIsImageHovered(false)}
        >
          <img
            src={post.featuredImage?.url || "https://cdn.prod.website-files.com/6830c725d64659302c257ba5/68355791264a183cb93d0510_image.webp"}
            alt={post.featuredImage?.alt || post.title}
            className={`w-full h-full object-cover transition-transform duration-700 ease-out ${isImageHovered ? 'scale-110' : 'scale-100'}`}
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            width="400"
            height="256"
          />
          
          {/* Gradient overlay that appears on hover */}
          <div className={`absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-transparent transition-opacity duration-500 ${isImageHovered ? 'opacity-100' : 'opacity-0'}`}></div>
          
          {/* Shine effect on hover */}
          <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-in-out ${isImageHovered ? 'translate-x-full' : '-translate-x-full'}`}></div>
          
          {/* Tag badge on image - matching reference design */}
          <div className="absolute top-4 left-4 z-10">
            <div className={`px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold shadow-lg transition-transform duration-300 ${isImageHovered ? 'scale-110' : 'scale-100'}`}>
              {firstTag}
            </div>
          </div>
        </Link>

        {/* Content wrapper - right side on desktop */}
        <div className="flex flex-col flex-grow p-6 md:p-8 lg:p-10 relative overflow-hidden">
          <div className="relative z-10 flex flex-col flex-grow">
            {/* Date, Author, and Read Time - matching reference layout */}
            <div className="flex items-center gap-4 mb-5 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4" />
                <time dateTime={post.date}>{shortDate}</time>
              </div>
              {post.author && (
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  <span>{post.author}</span>
                </div>
              )}
              {post.readTime && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{post.readTime}</span>
                </div>
              )}
            </div>

            {/* Title - clickable link with separate hover and prefetch */}
            <Link
              to={`/blog/${post.slug}`}
              className={`text-2xl md:text-3xl lg:text-4xl font-bold mb-5 leading-tight transition-colors duration-300 line-clamp-2 block ${isTitleHovered ? 'text-primary' : 'text-foreground'}`}
              onMouseEnter={() => {
                setIsTitleHovered(true);
                // Prefetch the blog post page on hover
                const link = document.createElement('link');
                link.rel = 'prefetch';
                link.href = `/blog/${post.slug}`;
                document.head.appendChild(link);
              }}
              onMouseLeave={() => setIsTitleHovered(false)}
            >
              {post.title}
            </Link>

            {/* Excerpt - matching reference style */}
            {post.excerpt && (
              <p className="text-base md:text-lg mb-8 line-clamp-3 leading-relaxed text-muted-foreground">
                {post.excerpt}
              </p>
            )}

            {/* Tags and Read More - matching reference layout */}
            <div className="mt-auto flex items-center justify-between gap-4 pt-6">
              {/* Tags - with expandable functionality */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {(showAllTags ? post.tags : post.tags.slice(0, 3)).map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 rounded-lg bg-muted text-xs font-medium text-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                  {post.tags.length > 3 && !showAllTags && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowAllTags(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-muted text-xs font-medium text-muted-foreground hover:bg-primary/20 hover:text-primary transition-all duration-300 cursor-pointer"
                    >
                      +{post.tags.length - 3}
                    </button>
                  )}
                  {showAllTags && post.tags.length > 3 && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowAllTags(false);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-muted text-xs font-medium text-muted-foreground hover:bg-primary/20 hover:text-primary transition-all duration-300 cursor-pointer"
                    >
                      Show less
                    </button>
                  )}
                </div>
              )}
              
              {/* Read More Button - clickable link with separate hover */}
              <Link
                to={`/blog/${post.slug}`}
                className={`inline-flex items-center text-sm font-semibold text-primary transition-all duration-300 shrink-0 ${isButtonHovered ? 'gap-3' : 'gap-2'}`}
                onMouseEnter={() => {
                  setIsButtonHovered(true);
                  // Prefetch the blog post page on hover
                  const link = document.createElement('link');
                  link.rel = 'prefetch';
                  link.href = `/blog/${post.slug}`;
                  document.head.appendChild(link);
                }}
                onMouseLeave={() => setIsButtonHovered(false)}
              >
                <span>Read More</span>
                <ArrowRight className={`w-4 h-4 transition-transform duration-300 ${isButtonHovered ? 'translate-x-1' : 'translate-x-0'}`} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
});

BlogCard.displayName = 'BlogCard';

export default BlogCard;
