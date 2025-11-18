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
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border border-gray-300 rounded-md overflow-hidden">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-4 py-2 border-r">Salutation</th>
              <th className="px-4 py-2 border-r">First Name</th>
              <th className="px-4 py-2 border-r">Last Name</th>
              <th className="px-4 py-2 border-r">Designation</th>
              <th className="px-4 py-2 border-r">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="underline decoration-dotted">
                      Email Address (i)
                    </TooltipTrigger>
                    <TooltipContent>
                      Check box to select if communication had to go to that email id too
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </th>
              <th className="px-4 py-2 border-r">Phone</th>
              <th className="px-4 py-2 border-r">Birthday</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {contactPersons.map((person, index) => (
              <tr key={`contact-${index}-${person.email || index}`} className="even:bg-gray-50">
                <td className="px-4 py-2 border-r">
                  <Select
                    value={person.salutation || "Mr."}
                    onValueChange={(value) => handleInputChange(index, "salutation", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mr.">Mr.</SelectItem>
                      <SelectItem value="Ms.">Ms.</SelectItem>
                      <SelectItem value="Mrs.">Mrs.</SelectItem>
                      <SelectItem value="Dr.">Dr.</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-2 border-r">
                  <Input
                    value={person.first_name || ""}
                    onChange={(e) => handleInputChange(index, "first_name", e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                  />
                </td>
                <td className="px-4 py-2 border-r">
                  <Input
                    value={person.last_name || ""}
                    onChange={(e) => handleInputChange(index, "last_name", e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                  />
                </td>
                <td className="px-4 py-2 border-r">
                  <Input
                    value={person.designation || ""}
                    onChange={(e) => handleInputChange(index, "designation", e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                  />
                </td>
                <td className="px-4 py-2 border-r">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
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
                <td className="px-4 py-2 border-r">
                  <Input
                    type="tel"
                    inputMode="tel"
                    value={person.phone_number || ""}
                    onChange={(e) => handleInputChange(index, "phone_number", e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                  />
                </td>
                <td className="px-4 py-2 border-r">
                  <Input
                    type="date"
                    value={person.birthday || ""}
                    onChange={(e) => handleInputChange(index, "birthday", e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                  />
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={!!person.email_send}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleInputChange(index, "email_send", e.target.checked);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                      <span>Email Send</span>
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

      <Button onClick={addContactPerson} type="button">
        <UserPlus className="mr-2 h-4 w-4" /> Add Contact
      </Button>
    </div>
  );
};

export default ContactPersonsSection;
