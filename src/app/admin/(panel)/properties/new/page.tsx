import { PropertyForm } from "@/components/admin/PropertyForm";

export const metadata = { title: "Add property" };

export default function NewProperty() {
  return (
    <div>
      <h1 className="mb-6 text-3xl">Add a property</h1>
      <PropertyForm p={null} />
    </div>
  );
}
