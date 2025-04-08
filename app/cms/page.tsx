"use client";

import { useState, useEffect } from "react";
import { updateVideo, deleteVideo } from "@/lib/video";
import { updateKeywords, deleteKeywords } from "@/lib/keyword";

const CMSPage = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [newVideo, setNewVideo] = useState<Partial<Video>>({});
  const [newKeywords, setNewKeywords] = useState<string[]>([]);
  const [newTranslatedKeywords, setNewTranslatedKeywords] = useState<
    { [k: string]: string }[]
  >([]);

  useEffect(() => {
    // Fetch videos from the server and set them to the state
    // This is a placeholder, replace with actual fetch logic
    setVideos([]);
  }, []);

  const handleAddVideo = async () => {
    if (newVideo.title && newVideo.url && newVideo.airedAt) {
      await updateVideo(newVideo.id!, newVideo as Video);
      setNewVideo({});
    }
  };

  const handleEditVideo = async () => {
    if (selectedVideo) {
      await updateVideo(selectedVideo.id, selectedVideo);
      setSelectedVideo(null);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    await deleteVideo(videoId);
    setVideos(videos.filter((video) => video.id !== videoId));
  };

  const handleAddKeywords = async (videoId: string) => {
    await updateKeywords(videoId, newKeywords, newTranslatedKeywords);
    setNewKeywords([]);
    setNewTranslatedKeywords([]);
  };

  const handleEditKeywords = async (videoId: string) => {
    await updateKeywords(videoId, newKeywords, newTranslatedKeywords);
    setNewKeywords([]);
    setNewTranslatedKeywords([]);
  };

  const handleDeleteKeywords = async (videoId: string) => {
    await deleteKeywords(videoId);
  };

  return (
    <div>
      <h1>CMS</h1>

      <h2>Add New Video</h2>
      <form onSubmit={handleAddVideo}>
        <input
          type="text"
          placeholder="Title"
          value={newVideo.title || ""}
          onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
        />
        <input
          type="text"
          placeholder="URL"
          value={newVideo.url || ""}
          onChange={(e) => setNewVideo({ ...newVideo, url: e.target.value })}
        />
        <input
          type="text"
          placeholder="Image URL"
          value={newVideo.imageUrl || ""}
          onChange={(e) =>
            setNewVideo({ ...newVideo, imageUrl: e.target.value })
          }
        />
        <input
          type="datetime-local"
          placeholder="Aired At"
          value={newVideo.airedAt || ""}
          onChange={(e) =>
            setNewVideo({ ...newVideo, airedAt: e.target.value })
          }
        />
        <button type="submit">Add Video</button>
      </form>

      <h2>Edit Video</h2>
      {selectedVideo && (
        <form onSubmit={handleEditVideo}>
          <input
            type="text"
            placeholder="Title"
            value={selectedVideo.title}
            onChange={(e) =>
              setSelectedVideo({ ...selectedVideo, title: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="URL"
            value={selectedVideo.url}
            onChange={(e) =>
              setSelectedVideo({ ...selectedVideo, url: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Image URL"
            value={selectedVideo.imageUrl}
            onChange={(e) =>
              setSelectedVideo({ ...selectedVideo, imageUrl: e.target.value })
            }
          />
          <input
            type="datetime-local"
            placeholder="Aired At"
            value={selectedVideo.airedAt}
            onChange={(e) =>
              setSelectedVideo({ ...selectedVideo, airedAt: e.target.value })
            }
          />
          <button type="submit">Edit Video</button>
        </form>
      )}

      <h2>Delete Video</h2>
      {videos.map((video) => (
        <div key={video.id}>
          <p>{video.title}</p>
          <button onClick={() => handleDeleteVideo(video.id)}>Delete</button>
        </div>
      ))}

      <h2>Add Keywords for Voice-Only Video</h2>
      <form onSubmit={() => handleAddKeywords(selectedVideo!.id)}>
        <input
          type="text"
          placeholder="Keywords"
          value={newKeywords.join(", ")}
          onChange={(e) => setNewKeywords(e.target.value.split(", "))}
        />
        <input
          type="text"
          placeholder="Translated Keywords"
          value={newTranslatedKeywords
            .map((t) => Object.values(t).join(", "))
            .join(", ")}
          onChange={(e) =>
            setNewTranslatedKeywords(
              e.target.value
                .split(", ")
                .map((t) => ({ [selectedVideo!.id]: t }))
            )
          }
        />
        <button type="submit">Add Keywords</button>
      </form>

      <h2>Edit Keywords for Voice-Only Video</h2>
      <form onSubmit={() => handleEditKeywords(selectedVideo!.id)}>
        <input
          type="text"
          placeholder="Keywords"
          value={newKeywords.join(", ")}
          onChange={(e) => setNewKeywords(e.target.value.split(", "))}
        />
        <input
          type="text"
          placeholder="Translated Keywords"
          value={newTranslatedKeywords
            .map((t) => Object.values(t).join(", "))
            .join(", ")}
          onChange={(e) =>
            setNewTranslatedKeywords(
              e.target.value
                .split(", ")
                .map((t) => ({ [selectedVideo!.id]: t }))
            )
          }
        />
        <button type="submit">Edit Keywords</button>
      </form>

      <h2>Delete Keywords for Voice-Only Video</h2>
      {videos
        .filter((video) => video.isVoiceOnly)
        .map((video) => (
          <div key={video.id}>
            <p>{video.title}</p>
            <button onClick={() => handleDeleteKeywords(video.id)}>
              Delete Keywords
            </button>
          </div>
        ))}
    </div>
  );
};

export default CMSPage;
