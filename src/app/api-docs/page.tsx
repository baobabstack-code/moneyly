import { getApiDocs } from "@/lib/swagger";
import ApiDocsClient from "@/components/ApiDocsClient";

export default function ApiDocsPage() {
  return <ApiDocsClient spec={getApiDocs()} />;
}
