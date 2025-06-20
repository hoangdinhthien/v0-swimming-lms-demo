interface CoursePageProps {
  params: Promise<{ id: string }>;
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { id } = await params;

  return (
    <div className='container mx-auto p-4'>
      <h1 className='text-2xl font-bold mb-4'>Course Page</h1>
      <p>Course ID: {id}</p>
      <p>This page is under construction.</p>
    </div>
  );
}
