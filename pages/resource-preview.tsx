import Resource from "@/components/resource";

export default function ResourcePreviewPage() {
  return (
    <main className="p-8">
      <Resource
        title="Sample Handout"
        fileUrl="https://www.learningcontainer.com/wp-content/uploads/2019/09/sample-pdf-file.pdf"
        isAdmin={true}
        onRemove={() => alert("Remove clicked")}
      />
    </main>
  );
}