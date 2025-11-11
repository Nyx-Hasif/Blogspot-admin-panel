/* eslint-disable @next/next/no-img-element */
"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  image_url?: string;
  image_name?: string;
  slug: string;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
}

export default function BlogPostPage() {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const params = useParams();

  const slug = params.slug as string;

  const fetchPost = useCallback(async (): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published") // Only published posts
        .single(); // Get single record

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned
          setError("Blog post not found");
        } else {
          throw error;
        }
        return;
      }

      setPost(data);
    } catch (error) {
      console.error("Error fetching post:", error);
      setError("Error loading blog post");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  // Fetch individual blog post by slug
  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug, fetchPost]);

  // Format date for display
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format content with basic line breaks
  const formatContent = (content: string): string => {
    return content.replace(/\n/g, "\n\n"); // Convert single line breaks to paragraphs
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading blog post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {error || "Blog post not found"}
          </h3>
          <p className="text-gray-600 mb-6">
            The blog post you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
          <Link
            href="/blog"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            ← Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link
            href="/blog"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Blog
          </Link>

          <div className="mb-4">
            <span className="text-sm text-gray-500">
              Published on {formatDate(post.created_at)}
            </span>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-xl text-gray-600 leading-relaxed">
              {post.excerpt}
            </p>
          )}
        </div>
      </div>

      {/* Featured Image */}
      {post.image_url && (
        <div className="relative">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full h-64 md:h-96 object-cover rounded-lg shadow-lg"
            />
          </div>
        </div>
      )}

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8 md:p-12">
          <div className="prose prose-lg max-w-none">
            {formatContent(post.content)
              .split("\n\n")
              .map(
                (paragraph, index) =>
                  paragraph.trim() && (
                    <p
                      key={index}
                      className="mb-6 text-gray-700 leading-relaxed"
                    >
                      {paragraph.trim()}
                    </p>
                  )
              )}
          </div>
        </div>
      </article>

      {/* Post Footer */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Thanks for reading!
              </h3>
              <p className="text-gray-600">Check out more posts on my blog.</p>
            </div>
            <Link
              href="/blog"
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              More Posts
            </Link>
          </div>
        </div>
      </div>

      {/* Additional Navigation */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <div className="flex justify-center space-x-4">
          <Link href="/blog" className="text-blue-600 hover:text-blue-800">
            ← All Posts
          </Link>
          <span className="text-gray-400">|</span>
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            Home
          </Link>
          <span className="text-gray-400">|</span>
          <Link
            href="/admin/add"
            className="text-gray-600 hover:text-gray-800 text-sm"
          >
            Admin
          </Link>
        </div>
      </div>
    </div>
  );
}
