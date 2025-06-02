import ffmpeg from 'fluent-ffmpeg';
ffmpeg.setFfprobePath('C:/ffmpeg/bin/ffprobe.exe');

export const getVideoDurationInSeconds = (videoPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        console.error("ffprobe error:", err);
        return reject(err);
      }

      const duration = metadata?.format?.duration;
      if (!duration) {
        console.error("Duration not found in metadata:", metadata);
        return reject(new Error("Duration not found"));
      }

      resolve(duration);
    });
  });
};
