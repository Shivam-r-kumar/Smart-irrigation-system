import * as Icons from "lucide-react";

export default function Icon({ name, ...props }) {
  const IconComponent = Icons[name] || Icons.Leaf;
  return <IconComponent aria-hidden="true" {...props} />;
}
