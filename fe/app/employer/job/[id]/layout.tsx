// Layout file to export generateStaticParams for static export
// This allows dynamic routes to work with output: 'export'

export async function generateStaticParams() {
  // Return at least one param to satisfy Next.js requirement
  // Actual pages will be rendered client-side at runtime
  return [{ id: 'placeholder' }];
}

export default function JobIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

