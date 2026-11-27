// Use the main application's router Link when provided; otherwise use native links.
export default function AuthLink({ to, LinkComponent, ...props }) {
  if (LinkComponent) {
    return <LinkComponent to={to} {...props} />;
  }
  return <a href={to} {...props} />;
}
