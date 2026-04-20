import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/avatar";
type ProfileMenuProps = {
  profileHref?: string;
  logoutHref?: string;
  initials?: string;
  avatarUrl?: string;
  className?: string;
};

export default function ProfileMenu({
  profileHref = "/",
  logoutHref = "/signout",
  initials = "U",
  avatarUrl,
  className = "",
}: ProfileMenuProps) {
  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="Open profile menu"
          className={`${className} rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2`}
        >
          <Avatar className="h-14 w-14 border border-gray-300 bg-gray-200 transition-brightness hover:brightness-90">
            {avatarUrl && (
              <AvatarImage
                src={avatarUrl}
                className="h-full w-full object-cover"
              />
            )}
            <AvatarFallback className="text-sm font-semibold text-gray-700">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={10}
          align="end"
          className="z-50 min-w-[180px] rounded-md border border-gray-200 bg-white p-1 shadow-lg"
        >
          <DropdownMenu.Item asChild>
            <Link
              href={profileHref}
              className="block cursor-pointer rounded-sm px-3 py-2 text-sm text-gray-800 outline-none hover:bg-gray-100 focus:bg-gray-100"
            >
              Profile Settings
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Item asChild>
            <Link
              href={logoutHref}
              className="block cursor-pointer rounded-sm px-3 py-2 text-sm text-red-700 outline-none hover:bg-red-50 focus:bg-red-50"
            >
              Log Out
            </Link>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
