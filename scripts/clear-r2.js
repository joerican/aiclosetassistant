const { S3Client, ListObjectsV2Command, DeleteObjectsCommand } = require("@aws-sdk/client-s3");

async function clearBucket() {
  const client = new S3Client({
    region: "auto",
    endpoint: "https://73d8f7df9a58eb64c1cc943d0c76d474.r2.cloudflarestorage.com",
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || ""
    }
  });

  let totalDeleted = 0;
  let continuationToken;

  do {
    const listCmd = new ListObjectsV2Command({
      Bucket: "closet-images",
      ContinuationToken: continuationToken
    });
    const list = await client.send(listCmd);

    if (!list.Contents || list.Contents.length === 0) {
      if (totalDeleted === 0) console.log("Bucket is empty");
      break;
    }

    console.log("Found " + list.Contents.length + " objects");

    const deleteCmd = new DeleteObjectsCommand({
      Bucket: "closet-images",
      Delete: { Objects: list.Contents.map(obj => ({ Key: obj.Key })) }
    });

    const result = await client.send(deleteCmd);
    totalDeleted += result.Deleted?.length || 0;
    console.log("Deleted " + (result.Deleted?.length || 0) + " objects");

    continuationToken = list.NextContinuationToken;
  } while (continuationToken);

  console.log("Total deleted: " + totalDeleted);
}

clearBucket().catch(e => console.error("Error:", e.message));
