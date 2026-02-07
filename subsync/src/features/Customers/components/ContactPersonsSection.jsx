import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip.jsx";

const ContactPersonsSection = ({ contactPersons, setContactPersons }) => {
  const handleInputChange = (index, field, value) => {
    setContactPersons(prev => {
      const updatedPersons = [...prev];
      if (!updatedPersons[index]) {
        updatedPersons[index] = { salutation: "Mr.", designation: "", first_name: "", last_name: "", email: "", include_in_communication: false, phone_number: "", birthday: "", email_send: false, country_code: "+91" };
      }
      updatedPersons[index] = { ...updatedPersons[index], [field]: value };
      return updatedPersons;
    });
  };

  const addContactPerson = () => {
    setContactPersons([
      ...contactPersons,
      { salutation: "Mr.", designation: "", first_name: "", last_name: "", email: "", include_in_communication: false, phone_number: "", birthday: "", email_send: false },
    ]);
  };

  const deleteContactPerson = (index) => {
    const updatedPersons = contactPersons.filter((_, i) => i !== index);
    setContactPersons(updatedPersons);
  };

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-[1.5rem] border border-gray-200 dark:border-slate-800">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-gray-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500">
            <tr>
              <th className="px-6 py-4 border-b border-r border-gray-200 dark:border-slate-800">Salutation</th>
              <th className="px-6 py-4 border-b border-r border-gray-200 dark:border-slate-800">First Name</th>
              <th className="px-6 py-4 border-b border-r border-gray-200 dark:border-slate-800">Last Name</th>
              <th className="px-6 py-4 border-b border-r border-gray-200 dark:border-slate-800">Designation</th>
              <th className="px-6 py-4 border-b border-r border-gray-200 dark:border-slate-800">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="underline decoration-dotted">
                      Email Address (i)
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-900 text-white border-slate-700">
                      Check box to select if communication had to go to that email id too
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </th>
              <th className="px-6 py-4 border-b border-r border-gray-200 dark:border-slate-800">Phone</th>
              <th className="px-6 py-4 border-b border-r border-gray-200 dark:border-slate-800">Birthday</th>
              <th className="px-6 py-4 border-b border-gray-200 dark:border-slate-800">Actions</th>
            </tr>
          </thead>
          <tbody>
            {contactPersons.map((person, index) => (
              <tr key={`contact-${index}-${person.email || index}`} className="bg-white dark:bg-slate-900 group">
                <td className="px-4 py-3 border-r border-b border-gray-100 dark:border-slate-800/50">
                  <Select
                    value={person.salutation || "Mr."}
                    onValueChange={(value) => handleInputChange(index, "salutation", value)}
                  >
                    <SelectTrigger className="w-full rounded-lg border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-900 dark:text-white h-9">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
                      <SelectItem value="Mr.">Mr.</SelectItem>
                      <SelectItem value="Ms.">Ms.</SelectItem>
                      <SelectItem value="Mrs.">Mrs.</SelectItem>
                      <SelectItem value="Dr.">Dr.</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3 border-r border-b border-gray-100 dark:border-slate-800/50">
                  <Input
                    value={person.first_name || ""}
                    onChange={(e) => handleInputChange(index, "first_name", e.target.value)}
                    className="rounded-lg border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-900 dark:text-white h-9"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                  />
                </td>
                <td className="px-4 py-3 border-r border-b border-gray-100 dark:border-slate-800/50">
                  <Input
                    value={person.last_name || ""}
                    onChange={(e) => handleInputChange(index, "last_name", e.target.value)}
                    className="rounded-lg border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-900 dark:text-white h-9"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                  />
                </td>
                <td className="px-4 py-3 border-r border-b border-gray-100 dark:border-slate-800/50">
                  <Input
                    value={person.designation || ""}
                    onChange={(e) => handleInputChange(index, "designation", e.target.value)}
                    className="rounded-lg border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-900 dark:text-white h-9"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                  />
                </td>
                <td className="px-4 py-3 border-r border-b border-gray-100 dark:border-slate-800/50">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-blue-600 rounded"
                      checked={!!person.include_in_communication}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleInputChange(index, "include_in_communication", e.target.checked);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                    <Input
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      autoCorrect="off"
                      spellCheck={false}
                      className="rounded-lg border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-900 dark:text-white h-9"
                      value={person.email || ""}
                      onChange={(e) => handleInputChange(index, "email", e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                    />
                  </div>
                </td>
                <td className="px-4 py-3 border-r border-b border-gray-100 dark:border-slate-800/50">
                  <Input
                    type="tel"
                    inputMode="tel"
                    value={person.phone_number || ""}
                    onChange={(e) => handleInputChange(index, "phone_number", e.target.value)}
                    className="rounded-lg border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-900 dark:text-white h-9"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                  />
                </td>
                <td className="px-4 py-3 border-r border-b border-gray-100 dark:border-slate-800/50">
                  <div className="w-[180px]">
                    <Input
                      type="date"
                      value={person.birthday || ""}
                      onChange={(e) => handleInputChange(index, "birthday", e.target.value)}
                      className="rounded-lg border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-900 dark:text-white h-9"
                    />
                  </div>
                </td>
                <td className="px-4 py-3 border-b border-gray-100 dark:border-slate-800/50">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-blue-600 rounded"
                        checked={!!person.email_send}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleInputChange(index, "email_send", e.target.checked);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                      <span className="text-xs font-medium text-gray-600 dark:text-slate-400">Email Send</span>
                    </label>
                    <Button
                      variant="destructive"
                      size="sm"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteContactPerson(index);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button
        onClick={addContactPerson}
        type="button"
        className="mt-6 bg-blue-600 hover:bg-blue-700 h-10 px-6 rounded-xl font-black uppercase tracking-widest text-[10px]"
      >
        <UserPlus className="mr-2 h-4 w-4" /> Add Contact
      </Button>
    </div>
  );
};

export default ContactPersonsSection;
