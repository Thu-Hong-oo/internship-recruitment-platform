import { 
  UserOutlined, 
  FileTextOutlined, 
  BookOutlined, 
  TrophyOutlined, 
  LinkOutlined, 
  TeamOutlined, 
  TagsOutlined, 
  AppstoreOutlined, 
  SettingOutlined, 
  PictureOutlined, 
  UpOutlined, 
  DownOutlined, 
  HomeOutlined, 
  BankOutlined,
  BarChartOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  InboxOutlined,
  EyeOutlined,
  ShoppingOutlined,
  ApartmentOutlined,
  ToolOutlined
} from '@ant-design/icons';

const UserIcon = ({ active }) => {
  const color = active ? "oklch(0.55 0.18 195)" : "#B0C0D5";
  return <UserOutlined style={{ color, fontSize: '20px' }} />;
};

const PostIcon = ({ active }) => {
  const color = active ? "oklch(0.55 0.18 195)" : "#B0C0D5";
  return <FileTextOutlined style={{ color, fontSize: '20px' }} />;
};

const ExamIcon = ({ active }) => {
  const color = active ? "oklch(0.55 0.18 195)" : "#B0C0D5";
  return <BookOutlined style={{ color, fontSize: '20px' }} />;
};

const CertIcon = ({ active }) => {
  const color = active ? "oklch(0.55 0.18 195)" : "#B0C0D5";
  return <TrophyOutlined style={{ color, fontSize: '20px' }} />;
};

const KnowledgeIcon = ({ active }) => {
  const color = active ? "oklch(0.55 0.18 195)" : "#B0C0D5";
  return <LinkOutlined style={{ color, fontSize: '20px' }} />;
};

const ClubIcon = ({ active }) => {
  const color = active ? "oklch(0.55 0.18 195)" : "#B0C0D5";
  return <TeamOutlined style={{ color, fontSize: '20px' }} />;
};

const CategoryIcon = ({ active }) => {
  const color = active ? "oklch(0.55 0.18 195)" : "#B0C0D5";
  return <TagsOutlined style={{ color, fontSize: '20px' }} />;
};

const InternIcon = ({ active }) => {
  const color = active ? "oklch(0.55 0.18 195)" : "#000D4D";
  return <AppstoreOutlined style={{ color, fontSize: '20px' }} />;
};

const ManagementIcon = ({ active }) => {
  const color = active ? "oklch(0.55 0.18 195)" : "#B0C0D5";
  return <SettingOutlined style={{ color, fontSize: '20px' }} />;
};

const MediaIcon = ({ active }) => {
  const color = active ? "oklch(0.55 0.18 195)" : "#000D4D";
  return <PictureOutlined style={{ color, fontSize: '20px' }} />;
};

const ChevronUpIcon = ({ active }) => {
  const color = active ? "oklch(0.55 0.18 195)" : "#000D4D";
  return <UpOutlined style={{ color, fontSize: '16px' }} />;
};

const ChevronDownIcon = ({ active }) => {
  const color = active ? "oklch(0.55 0.18 195)" : "#000D4D";
  return <DownOutlined style={{ color, fontSize: '16px' }} />;
};

const HomeIcon = ({ active }) => {
  const color = active ? "oklch(0.55 0.18 195)" : "#B0C0D5";
  return <HomeOutlined style={{ color, fontSize: '20px' }} />;
};

const BankOutlinedIcon = ({ active }) => {
  const color = active ? "oklch(0.55 0.18 195)" : "#B0C0D5";
  return <BankOutlined style={{ color, fontSize: '20px' }} />;
};

const ChartIcon = ({ active }) => {
  const color = active ? "oklch(0.55 0.18 195)" : "#B0C0D5";
  return <BarChartOutlined style={{ color, fontSize: '20px' }} />;
};

const DollarIcon = ({ active }) => {
  const color = active ? "oklch(0.55 0.18 195)" : "#B0C0D5";
  return <DollarOutlined style={{ color, fontSize: '20px' }} />;
};

const ClockIcon = ({ active }) => {
  const color = active ? "oklch(0.55 0.18 195)" : "#B0C0D5";
  return <ClockCircleOutlined style={{ color, fontSize: '20px' }} />;
};

const PackageIcon = ({ active }) => {
  const color = active ? "oklch(0.55 0.18 195)" : "#B0C0D5";
  return <InboxOutlined style={{ color, fontSize: '20px' }} />;
};

const ViewIcon = ({ active }) => {
  const color = active ? "oklch(0.55 0.18 195)" : "#B0C0D5";
  return <EyeOutlined style={{ color, fontSize: '20px' }} />;
};

const WorkIcon = ({ active }) => {
  const color = active ? "oklch(0.55 0.18 195)" : "#B0C0D5";
  return <ShoppingOutlined style={{ color, fontSize: '20px' }} />;
};

const SkillIcon = ({ active }) => {
  const color = active ? "oklch(0.55 0.18 195)" : "#B0C0D5";
  return <ToolOutlined style={{ color, fontSize: '20px' }} />;
};

const CompanyIcon = ({ active }) => {
  const color = active ? "oklch(0.55 0.18 195)" : "#B0C0D5";
  return <ApartmentOutlined style={{ color, fontSize: '20px' }} />;
};

export default { 
  UserIcon, PostIcon, ExamIcon, CertIcon, KnowledgeIcon, ClubIcon, CategoryIcon, InternIcon, ManagementIcon, MediaIcon, 
  ChevronUpIcon, ChevronDownIcon, HomeIcon, BankOutlined: BankOutlinedIcon, ChartIcon, DollarIcon, ClockIcon, PackageIcon, ViewIcon, WorkIcon, SkillIcon, CompanyIcon
};
