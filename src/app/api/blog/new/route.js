await fetch('/api/blogs', {
  method: 'POST',
  body: JSON.stringify({
    authorName,
    specialization,
    title,
    content,
    authorRole
  }),
});
router.push('/blogs');
