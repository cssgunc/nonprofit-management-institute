import Resource from "@/components/resource";

export default function ResourcePreviewPage() {
  const handleRemove = () => {
    // Replace this with your real delete API call.
    console.log("Resource deleted");
  };

  return (
    <main className="p-8">
      <Resource
        title="Sample Handout"
        fileUrl="https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf"
        isAdmin={true}
        onRemove={handleRemove}
      />
    </main>
  );
}