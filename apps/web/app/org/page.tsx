import { notFound, redirect } from "next/navigation";
import { IS_LMS } from "@/lib/portal";

/** Shared-code login was retired. Private workspaces use personal accounts. */
export default function RetiredPortal() {
  if (!IS_LMS) notFound();
  redirect("/orgs");
}
