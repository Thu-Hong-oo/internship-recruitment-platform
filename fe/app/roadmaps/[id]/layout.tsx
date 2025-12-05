// Layout file to export generateStaticParams for static export
// This allows the client component page to work with output: 'export'

export async function generateStaticParams() {
  // Return at least one param to satisfy Next.js requirement
  // Actual pages will be rendered client-side at runtime
  return [{ id: 'placeholder' }];
}

export default function RoadmapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

