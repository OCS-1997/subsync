import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const VendorContactPersonsSection = ({ contactPersons, setContactPersons }) => {
  const handleInputChange = (index, field, value) => {
    const updatedPersons = [...contactPersons];
    updatedPersons[index][field] = value;
    setContactPersons(updatedPersons);
  };

  const addContactPerson = () => {
    setContactPersons([
      ...contactPersons,
      { salutation: "Mr.", designation: "", first_name: "", last_name: "", email: "", phone_number: "" },
    ]);
  };

  const deleteContactPerson = (index) => {
    const updatedPersons = contactPersons.filter((_, i) => i !== index);
    setContactPersons(updatedPersons);
  };

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
        <table className="w-full text-sm text-left border-collapse bg-white dark:bg-slate-900">
          <thead className="bg-gray-50 dark:bg-slate-800/50">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 border-b border-gray-100 dark:border-slate-800">Salutation</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 border-b border-gray-100 dark:border-slate-800">First Name</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 border-b border-gray-100 dark:border-slate-800">Last Name</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 border-b border-gray-100 dark:border-slate-800">Designation</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 border-b border-gray-100 dark:border-slate-800">Email Address</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 border-b border-gray-100 dark:border-slate-800">Phone</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 border-b border-gray-100 dark:border-slate-800 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
            {contactPersons.length > 0 ? contactPersons.map((person, index) => (
              <tr key={index} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/20 transition-colors">
                <td className="px-4 py-3">
                  <Select
                    value={person.salutation || "Mr."}
                    onValueChange={(value) => handleInputChange(index, "salutation", value)}
                  >
                    <SelectTrigger className="w-full h-9 rounded-lg border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                      <SelectItem value="Mr." className="text-xs">Mr.</SelectItem>
                      <SelectItem value="Ms." className="text-xs">Ms.</SelectItem>
                      <SelectItem value="Mrs." className="text-xs">Mrs.</SelectItem>
                      <SelectItem value="Dr." className="text-xs">Dr.</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3">
                  <Input
                    value={person.first_name}
                    onChange={(e) => handleInputChange(index, "first_name", e.target.value)}
                    className="h-9 rounded-lg border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold"
                  />
                </td>
                <td className="px-4 py-3">
                  <Input
                    value={person.last_name}
                    onChange={(e) => handleInputChange(index, "last_name", e.target.value)}
                    className="h-9 rounded-lg border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold"
                  />
                </td>
                <td className="px-4 py-3">
                  <Input
                    value={person.designation}
                    onChange={(e) => handleInputChange(index, "designation", e.target.value)}
                    className="h-9 rounded-lg border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold"
                  />
                </td>
                <td className="px-4 py-3">
                  <Input
                    type="email"
                    value={person.email}
                    onChange={(e) => handleInputChange(index, "email", e.target.value)}
                    className="h-9 rounded-lg border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold"
                  />
                </td>
                <td className="px-4 py-3">
                  <Input
                    type="tel"
                    value={person.phone_number}
                    onChange={(e) => handleInputChange(index, "phone_number", e.target.value)}
                    className="h-9 rounded-lg border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold"
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    type="button"
                    onClick={() => deleteContactPerson(index)}
                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all active:scale-90"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-400 dark:text-slate-500 italic">
                  No contact persons added yet. Click "Add Contact" to start.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Button
        onClick={addContactPerson}
        type="button"
        variant="outline"
        className="rounded-xl h-11 px-6 font-black uppercase tracking-widest text-[10px] border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white transition-all shadow-sm"
      >
        <UserPlus className="mr-2 h-4 w-4" /> Add Contact Person
      </Button>
    </div>
  );
};

export default VendorContactPersonsSection;
