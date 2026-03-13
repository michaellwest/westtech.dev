import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import { renderOgImage } from "@/lib/og-template";

export const prerender = true;

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getCollection("posts", ({ data }) => !data.draft);
  return posts.map((post) => ({
    params: { slug: post.id },
    props: {
      title: post.data.title,
      description: post.data.description,
      tags: post.data.tags,
    },
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const { title, description, tags } = props as {
    title: string;
    description: string;
    tags: string[];
  };

  const png = await renderOgImage({ title, description, tags });

  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
