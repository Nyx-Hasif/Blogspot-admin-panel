/* eslint-disable @next/next/no-img-element */
"use client";
import { useState, useEffect, FormEvent, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";

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

export default function EditPost() {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [excerpt, setExcerpt] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"draft" | "published">("published");
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const fetchPost = useCallback(async (): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("id", postId)
        .single();

      if (error) throw error;

      // Populate form with existing data
      setPost(data);
      setTitle(data.title);
      setContent(data.content);
      setExcerpt(data.excerpt || "");
      setStatus(data.status);
    } catch (error) {
      console.error("Error fetching post:", error);
      setError("Post not found");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  // Generate URL-friendly slug from title
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  // Fetch existing post data
  useEffect(() => {
    if (postId) {
      fetchPost();
    }
  }, [postId, fetchPost]);

  // Upload new image to Supabase Storage
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;

      const { error } = await supabase.storage
        .from("blog-images")
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("blog-images")
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
  };

  // Delete old image from storage
  const deleteOldImage = async (imageUrl: string): Promise<void> => {
    try {
      const fileName = imageUrl.split("/").pop();
      if (fileName) {
        await supabase.storage.from("blog-images").remove([fileName]);
      }
    } catch (error) {
      console.error("Error deleting old image:", error);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert("Title and content are required!");
      return;
    }

    try {
      setUpdating(true);

      let imageUrl = post?.image_url || null;
      let imageName = post?.image_name || null;

      // Handle image replacement
      if (selectedFile) {
        // Delete old image if exists
        if (post?.image_url) {
          await deleteOldImage(post.image_url);
        }

        // Upload new image
        imageUrl = await uploadImage(selectedFile);
        imageName = selectedFile.name;

        if (!imageUrl) {
          alert("Error uploading image!");
          setUpdating(false);
          return;
        }
      }

      // Generate new slug from title
      const slug = generateSlug(title);

      // Update blog post in database
      const { error } = await supabase
        .from("blog_posts")
        .update({
          title: title.trim(),
          content: content.trim(),
          excerpt: excerpt.trim() || null,
          image_url: imageUrl,
          image_name: imageName,
          slug: slug,
          status: status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", postId)
        .select();

      if (error) {
        console.error("Database error:", error);
        alert("Error updating post: " + error.message);
        return;
      }

      alert("Post updated successfully!");
      router.push("/admin"); // Redirect to admin dashboard
    } catch (error) {
      console.error("Error updating post:", error);
      alert("Unexpected error occurred!");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {error || "Post not found"}
          </h3>
          <button
            onClick={() => router.push("/admin")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/admin")}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
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
            Back to Admin Dashboard
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Edit Blog Post
          </h1>
          <p className="text-gray-600">Update and modify your blog post</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-md p-8 space-y-6"
        >
          {/* Current Image Display */}
          {post.image_url && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Featured Image
              </label>
              <img
                src={post.image_url}
                alt="Current featured image"
                className="w-full max-w-md h-48 object-cover rounded-md border border-gray-300 mb-2"
              />
              <p className="text-sm text-gray-500">
                Upload a new image to replace this one
              </p>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Post Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter blog post title..."
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              required
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Excerpt (Short Description)
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief description of the blog post..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your blog post content here..."
              rows={12}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Replace Featured Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Replace Featured Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {selectedFile && (
              <p className="text-sm text-gray-600 mt-2">
                New image selected: {selectedFile.name}
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "draft" | "published")
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={updating || !title.trim() || !content.trim()}
              className="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {updating ? "Updating Post..." : "Update Post"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="px-8 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
