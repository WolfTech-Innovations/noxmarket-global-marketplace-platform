import type { APIRoute } from 'astro';
import { createBucketClient } from '@cosmicjs/sdk';

const cosmic = () => createBucketClient({
  bucketSlug: import.meta.env.COSMIC_BUCKET_SLUG,
  readKey:    import.meta.env.COSMIC_READ_KEY,
  writeKey:   import.meta.env.COSMIC_WRITE_KEY,
});

export const GET: APIRoute = async ({ request }) => {
  const uid = new URL(request.url).searchParams.get('uid');
  if (!uid) return new Response('bad',{status:400});
  try {
    const r = await cosmic().objects.find({ type:'nox-user-profiles', slug:uid }).props(['id','slug','metadata']).limit(1);
    const obj = r?.objects?.[0] || null;
    return new Response(JSON.stringify(obj),{headers:{'Content-Type':'application/json'}});
  } catch { return new Response('null',{headers:{'Content-Type':'application/json'}}); }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const { uid, profile } = await request.json();
    if (!uid) return new Response('bad',{status:400});
    const r = await cosmic().objects.insertOne({ title:`Nox User ${uid}`, slug:uid, type:'nox-user-profiles', status:'published', metadata:profile });
    return new Response(JSON.stringify(r),{headers:{'Content-Type':'application/json'}});
  } catch(e) { 
  console.error('[profile POST]', JSON.stringify(e));
  return new Response(JSON.stringify({error: String(e), detail: e?.message, stack: e?.stack}),{status:500}); 
}

export const PATCH: APIRoute = async ({ request }) => {
  try {
    const { id, profile } = await request.json();
    if (!id) return new Response('bad',{status:400});
    const r = await cosmic().objects.updateOne(id,{ metadata:profile });
    return new Response(JSON.stringify(r),{headers:{'Content-Type':'application/json'}});
  } catch(e) { return new Response(JSON.stringify({error:String(e)}),{status:500}); }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const { id } = await request.json();
    if (!id) return new Response('bad',{status:400});
    const r = await cosmic().objects.deleteOne(id);
    return new Response(JSON.stringify(r),{headers:{'Content-Type':'application/json'}});
  } catch(e) { return new Response(JSON.stringify({error:String(e)}),{status:500}); }
};
