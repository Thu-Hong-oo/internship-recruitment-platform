import { Menu } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import menuConfig from "../config/menuConfig";
import adminMenuConfig from "../config/adminMenuConfig";
import companyMenuConfig from "../config/companyMenuConfig";
import candidateMenuConfig from "../config/candidateMenuConfig";
import { useMemo } from "react";
import Icons from "../assets/Icons";

const joinPath = (parent, child) => {
  if (!child) return parent;
  if (child.startsWith("/")) return child;
  return `${parent}/${child}`.replace(/\/+/g, "/"); // tránh // thừa
};

const findParentKeys = (path, nodes, parentPath = "") => {
  for (const n of nodes) {
    const fullPath = joinPath(parentPath, n.path);
    if (fullPath === path) return [fullPath];
    if (n.children) {
      const child = findParentKeys(path, n.children, fullPath);
      if (child.length) return [fullPath, ...child];
    }
  }
  return [];
};

const buildItems = (nodes, parentPath = "", pathname = "", openKeys = []) =>
  nodes.map((n) => {
    const fullPath = joinPath(parentPath, n.path);
    const isSelected = pathname === fullPath;
    const isParentActive = openKeys.includes(fullPath);
    const IconComp = n.icon;
    return {
      key: fullPath,
      label: (
        <span className={`flex items-center gap-2 rounded`}>
          {IconComp && <IconComp active={isSelected || isParentActive} />}
          <span
            className={`${
              isSelected || isParentActive ? " font-medium" : "text-[#000D4D73] font-normal"
            } capitalize leading-tight break-words whitespace-normal`}
          >
            {n.label}
          </span>
        </span>
      ),
      children: n.children ? buildItems(n.children, fullPath, pathname, openKeys) : undefined,
    };
  });

//For case not in menuConfig -> find parent near it
const findNearestMatchedKey = (path, nodes, parentPath = "") => {
  let matched = null;
  for (const n of nodes) {
    const fullPath = joinPath(parentPath, n.path);

    if (path === fullPath || path.startsWith(fullPath + "/")) {
      matched = fullPath; // Update matched
    }

    if (n.children) {
      const childMatch = findNearestMatchedKey(path, n.children, fullPath);
      if (childMatch) {
        matched = childMatch;
      }
    }
  }
  return matched;
};

export default function SideMenu() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  
  // Lấy role từ userInfo hoặc localStorage
  const getUserRole = () => {
    const userInfo = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const parsed = JSON.parse(userInfo);
        return parsed.role;
      } catch (e) {
        return 'admin';
      }
    }
    return localStorage.getItem('userRole') || 'admin';
  };
  
  const userRole = getUserRole();
  
  // Chọn menu config theo role
  const getMenuConfig = () => {
    switch (userRole) {
      case 'company':
        return companyMenuConfig;
      case 'candidate':
        return candidateMenuConfig;
      case 'admin':
      default:
        return adminMenuConfig;
    }
  };
  
  const currentMenuConfig = getMenuConfig();
  
  //For cases where the path is not in menuConfig
  const selectedKey = useMemo(() => findNearestMatchedKey(pathname, currentMenuConfig), [pathname, currentMenuConfig]);

  const openKeys = useMemo(() => findParentKeys(selectedKey, currentMenuConfig), [selectedKey, currentMenuConfig]);
  return (
    <Menu
      mode="inline"
      selectedKeys={[selectedKey]}
      defaultOpenKeys={openKeys}
      items={buildItems(currentMenuConfig, "", pathname, openKeys)}
      inlineIndent={22}
      onClick={({ key }) => navigate(key)}
      // expandIcon={({ isOpen }) => isOpen ? <Icons.ChevronUpIcon /> : <Icons.ChevronDownIcon />}
      style={{ borderRight: 0, "--antd-wave-shadow-color": "transparent" }}
      className="custom-side-menu"
    />
  );
}
