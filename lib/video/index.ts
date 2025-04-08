"use server";

import { Pool } from "pg";

import { DEFAULT_VIDEO_LIMIT } from "./constants";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export type PaginationParams = {
  cursor?: string | null;
  limit?: number;
  tag?: string | null;
};

export type PaginationResult = {
  videos: Video[];
  nextCursor: string | null;
  hasMore: boolean;
};

export async function getVideos({
  cursor = null,
  limit = DEFAULT_VIDEO_LIMIT,
  tag = null,
}: PaginationParams): Promise<PaginationResult> {
  const client = await pool.connect();

  try {
    let query: string;
    const whereConditions = [`v.published = TRUE`];
    const params = [];
    let paramIndex = 1;

    if (tag) {
      query = `
        SELECT v.*, ARRAY_AGG(t2.name) as tags
        FROM videos v
        JOIN video_tags vt1 ON v.id = vt1.video_id
        JOIN tags t1 ON vt1.tag_id = t1.id AND t1.name = $${paramIndex++}
        LEFT JOIN video_tags vt2 ON v.id = vt2.video_id
        LEFT JOIN tags t2 ON vt2.tag_id = t2.id
      `;
      params.push(tag);
    } else {
      query = `
        SELECT v.*, ARRAY_AGG(t.name) as tags
        FROM videos v
        LEFT JOIN video_tags vt ON v.id = vt.video_id
        LEFT JOIN tags t ON vt.tag_id = t.id
      `;
    }

    if (cursor) {
      whereConditions.push(`v.aired_at < $${paramIndex++}`);
      params.push(new Date(cursor));
    }

    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(" AND ")}`;
    }

    query += `
      GROUP BY v.id
      ORDER BY v.aired_at DESC
      LIMIT $${paramIndex++}
    `;

    params.push(limit + 1);

    const result = await client.query(query, params);

    const hasMore = result.rows.length > limit;
    const pageVideos = result.rows.slice(0, limit);

    let nextCursor = null;
    if (pageVideos.length > 0) {
      nextCursor = pageVideos[pageVideos.length - 1].aired_at;
    }

    return {
      videos: pageVideos.map((row) => ({
        id: row.id,
        url: row.url,
        title: row.title,
        imageUrl: row.image_url,
        airedAt: row.aired_at.toISOString(),
        isVoiceOnly: row.is_voice_only,
        tags: row.tags.filter(Boolean),
        published: row.published,
      })),
      nextCursor: hasMore ? nextCursor : null,
      hasMore,
    };
  } finally {
    client.release();
  }
}

export async function getAllTags(): Promise<string[]> {
  const client = await pool.connect();

  try {
    const result = await client.query(`
      SELECT t.name, COUNT(vt.video_id) as video_count
      FROM tags t
      JOIN video_tags vt ON t.id = vt.tag_id
      JOIN videos v ON vt.video_id = v.id
      WHERE v.published = TRUE
      GROUP BY t.name
      ORDER BY t.name
    `);

    return result.rows.map((row) => row.name);
  } finally {
    client.release();
  }
}

export async function updateVideo(videoId: string, videoData: Partial<Video>) {
  const client = await pool.connect();

  try {
    const { title, url, imageUrl, airedAt, isVoiceOnly, tags } = videoData;

    await client.query('BEGIN');

    const updateQuery = `
      UPDATE videos
      SET title = $1, url = $2, image_url = $3, aired_at = $4, is_voice_only = $5
      WHERE id = $6
    `;

    await client.query(updateQuery, [title, url, imageUrl, airedAt, isVoiceOnly, videoId]);

    if (tags) {
      const deleteTagsQuery = `
        DELETE FROM video_tags
        WHERE video_id = $1
      `;

      await client.query(deleteTagsQuery, [videoId]);

      const insertTagsQuery = `
        INSERT INTO video_tags (video_id, tag_id)
        VALUES ($1, (SELECT id FROM tags WHERE name = $2))
      `;

      for (const tag of tags) {
        await client.query(insertTagsQuery, [videoId, tag]);
      }
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteVideo(videoId: string) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const deleteTagsQuery = `
      DELETE FROM video_tags
      WHERE video_id = $1
    `;

    await client.query(deleteTagsQuery, [videoId]);

    const deleteVideoQuery = `
      DELETE FROM videos
      WHERE id = $1
    `;

    await client.query(deleteVideoQuery, [videoId]);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
