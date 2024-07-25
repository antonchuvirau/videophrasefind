Production website: https://videophrasefind.com/

Preview on our Vercel: https://videophrasefind.vercel.app/

The client has provided an AI model (written in Python). We took care of the frontend, deployment and infrastrcture. We also wrapped the client’s code into Python server (Fastapi) and deployed to AWS EC2 (GPU instance). We designed the whole data pipeline and infrastructure (video upload → store on s3 → trigger transcription job → put transcription next to the video on s3 → display data on the client). Website is now fully SEO-friendly.

Notable features:

- Videos can be uploaded or linked from youtube (yt-dl is used to download them on the server)
- Using standard WEVTT format for subtitles
- Videos and subtitle files are stored on AWS s3
- Website is fully SEO-friendly
- Vercel analytics
- Thumbnails are generated on-the-fly in browser
- Subtitle search

Technologies used:

- NextJS
- React-query
- FastAPI
- AWS SDK (ec2, s3)
