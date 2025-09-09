import { Command, CommandInput } from "@/components/ui/command";

function SearchFilterForm({ search, setSearch, handleSearch }) {
  return (
    <div className="w-full flex flex-col sm:flex-row items-center gap-2 mb-2">
      <div className="relative w-full sm:w-auto" style={{ minWidth: '320px', maxWidth: '500px' }}>
        <Command className="border rounded-full border-gray-300 w-full">
          <CommandInput
            value={search}
            className="text-pretty w-full font-semibold "
            onValueChange={setSearch}
            placeholder="Search"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
            style={{ minWidth: '300px', fontSize: '1.1rem', paddingLeft: '1.2rem', paddingRight: '1.2rem' }}
          />
        </Command>
      </div>
    </div>
  );
}


export default SearchFilterForm;
