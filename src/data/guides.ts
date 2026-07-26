export type GuideStep = {
  title: string;
  body: string;
  note?: string;
  warning?: string;
};

export type GuideSection = {
  id: string;
  kicker?: string;
  title: string;
  intro?: string;
  steps?: GuideStep[];
  points?: string[];
  success?: string;
};

export type Guide = {
  slug: string;
  title: string;
  subtitle: string;
  category: "账号与安全" | "Office 应用" | "Outlook 邮箱" | "Teams" | "OneDrive 与 SharePoint" | "设备与工具";
  description: string;
  duration: string;
  device: string;
  keywords: string[];
  completion: string;
  prepare: { label: string; text: string }[];
  sections: GuideSection[];
};

export const guides: Guide[] = [
  {
    slug: "first-sign-in",
    title: "首次登录并激活公司账号",
    subtitle: "首次密码 · 多重身份验证 · 修改临时密码",
    category: "账号与安全",
    description: "首次收到公司 Microsoft 365 账号后，完成登录、安全验证和临时密码修改。",
    duration: "约 10 分钟",
    device: "电脑 + 手机",
    keywords: ["第一次登录", "激活账号", "临时密码", "首次密码", "MFA", "二维码", "Authenticator", "验证码", "分所账号"],
    completion: "可以进入 Microsoft“我的账户”，并能使用验证器或电话完成身份验证。",
    prepare: [
      { label: "公司账号", text: "欢迎邮件中提供的公司邮箱地址" },
      { label: "临时密码", text: "仅使用 HR 单独提供的临时密码" },
      { label: "手机", text: "苹果安装 Microsoft Authenticator；安卓按公司要求安装指定验证器" },
    ],
    sections: [
      {
        id: "sign-in",
        kicker: "步骤一",
        title: "使用公司账号首次登录",
        steps: [
          { title: "打开“我的账户”", body: "在电脑浏览器访问 https://myaccount.microsoft.com/。" },
          { title: "输入公司账号", body: "输入欢迎邮件中的公司邮箱地址，点击“下一步”。" },
          { title: "输入临时密码", body: "输入 HR 单独提供的临时密码。不要使用公开文档、聊天记录或他人的密码。" },
          { title: "完成当前验证", body: "如果页面要求输入验证码，请使用公司指定且只发给您本人的验证方式。无法获取时请联系 IT，不要反复猜测。" },
        ],
      },
      {
        id: "authenticator",
        kicker: "步骤二",
        title: "配置多重身份验证",
        intro: "页面要求保护账号时，请根据手机类型选择验证器。详细图文流程可打开“添加账号验证方式”指引。",
        steps: [
          { title: "苹果手机", body: "安装 Microsoft Authenticator，在应用中添加“工作或学校账户”，扫描电脑二维码并完成数字匹配。" },
          { title: "安卓手机", body: "按照公司要求安装腾讯身份验证器；在网页选择“其他身份验证器”，扫描二维码并输入 6 位动态验证码。" },
        ],
      },
      {
        id: "change-password",
        kicker: "步骤三",
        title: "修改临时密码",
        steps: [
          { title: "按照页面提示进入修改密码", body: "首次登录完成后，系统可能自动要求修改密码。" },
          { title: "设置新密码", body: "输入临时密码和两次相同的新密码。以页面显示的密码复杂度要求为准。" },
          { title: "重新登录", body: "修改成功后，Outlook、Teams、OneDrive 和 Office 均应使用新密码。" },
        ],
        success: "能够使用新密码登录，并且安全信息中能看到已配置的验证方式。",
      },
    ],
  },
  {
    slug: "install-m365",
    title: "安装 Microsoft 365 应用",
    subtitle: "Word · Excel · PowerPoint · Outlook · Teams",
    category: "Office 应用",
    description: "下载并安装公司提供的 Microsoft 365 应用套件，并按需关闭 Teams 开机启动。",
    duration: "约 15–40 分钟",
    device: "Windows 电脑",
    keywords: ["安装Office", "安装M365", "Word下载", "Excel下载", "Office安装包", "Teams开机启动", "安装套件"],
    completion: "开始菜单中可以打开 Word、Excel、PowerPoint 和 Outlook，应用没有持续显示安装错误。",
    prepare: [
      { label: "安装包", text: "公司提供的 M365 安装包或下载链接" },
      { label: "账号", text: "已经激活的公司 Microsoft 365 账号" },
      { label: "环境", text: "稳定网络、足够磁盘空间，并保持电脑接电" },
    ],
    sections: [
      {
        id: "download",
        kicker: "步骤一",
        title: "下载安装包",
        steps: [
          { title: "打开公司提供的安装包链接", body: "访问公司分享的 M365 安装包。页面要求登录时，使用已经激活的公司账号。" },
          { title: "下载压缩包", body: "点击页面左上角的“下载”，等待文件完全下载。" },
          { title: "解压缩", body: "在下载文件上右键，选择“全部解压缩”或使用系统解压功能。" },
        ],
      },
      {
        id: "install",
        kicker: "步骤二",
        title: "安装所需语言版本",
        steps: [
          { title: "选择正确的语言安装包", body: "根据实际需要选择中文、英文或公司指定的 Office 语言版本。" },
          { title: "运行安装程序", body: "双击安装程序并允许系统运行。安装期间不要关机或断网。" },
          { title: "等待完成", body: "安装窗口关闭或显示完成后，从开始菜单打开任一 Office 应用确认。" },
        ],
        success: "Word、Excel 或 PowerPoint 能正常启动。首次启动仍需使用公司账号登录。",
      },
      {
        id: "teams-startup",
        kicker: "可选",
        title: "关闭 Teams 开机自动启动",
        steps: [
          { title: "打开 Windows 设置", body: "进入“设置”→“应用”→“已安装的应用”。" },
          { title: "搜索 Teams", body: "找到 Microsoft Teams，进入“高级选项”。" },
          { title: "关闭登录后运行", body: "将“登录后运行”或开机启动选项关闭。" },
        ],
      },
    ],
  },
  {
    slug: "office-sign-in",
    title: "登录 Office 桌面应用",
    subtitle: "激活 Word · Excel · PowerPoint",
    category: "Office 应用",
    description: "Microsoft 365 安装完成后，在任一 Office 桌面应用中登录公司账号。",
    duration: "约 3 分钟",
    device: "Windows 或 macOS",
    keywords: ["Office登录", "Word登录", "Excel登录", "PowerPoint登录", "Office激活", "登录或创建账户", "未授权产品"],
    completion: "Office 应用右上角显示公司账号，且不再提示“未授权产品”或要求激活。",
    prepare: [
      { label: "应用", text: "已经安装 Word、Excel 或 PowerPoint" },
      { label: "账号", text: "公司邮箱和当前密码" },
      { label: "验证", text: "可用的电话或验证器" },
    ],
    sections: [
      {
        id: "open",
        kicker: "步骤一",
        title: "打开任一 Office 应用",
        steps: [
          { title: "从开始菜单启动", body: "打开 Windows“开始”菜单，搜索并打开 Word、Excel 或 PowerPoint。" },
          { title: "等待登录窗口", body: "首次启动通常会自动弹出登录窗口。如果没有弹出，可点击右上角头像或“文件”→“账户”。" },
        ],
      },
      {
        id: "sign-in",
        kicker: "步骤二",
        title: "登录并激活",
        steps: [
          { title: "选择“登录或创建账户”", body: "输入公司邮箱地址，点击“下一步”。" },
          { title: "输入密码", body: "输入当前公司账号密码，并完成电话或验证器确认。" },
          { title: "确认激活状态", body: "返回“账户”页面，确认已显示公司账号和 Microsoft 365 订阅。" },
        ],
        success: "Word、Excel、PowerPoint 等应用均可共用同一个公司登录状态。",
      },
    ],
  },
  {
    slug: "outlook",
    title: "Outlook 邮箱使用指引",
    subtitle: "登录 · 发信 · 共享邮箱 · 日历 · 撤回 · 文件夹",
    category: "Outlook 邮箱",
    description: "配置 Outlook Classic，并掌握公司邮箱、共享邮箱、日历和邮件整理的常用操作。",
    duration: "按需阅读",
    device: "电脑或手机",
    keywords: ["Outlook登录", "添加账户", "共享邮箱", "共享邮箱发件人", "分所邮箱", "分所邮箱发件人", "发件人", "重点收件箱", "撤回邮件", "日历", "联系人", "文件夹", "手机Outlook"],
    completion: "可以收发公司邮件、查看授权的共享邮箱，并完成日历和文件夹等常用操作。",
    prepare: [
      { label: "软件", text: "推荐使用 Outlook Classic；手机可安装 Outlook" },
      { label: "账号", text: "公司邮箱、当前密码和可用验证方式" },
      { label: "共享邮箱", text: "由管理员授权后自动显示，不需要单独密码" },
    ],
    sections: [
      {
        id: "setup",
        kicker: "首次使用",
        title: "登录或添加 Outlook 账户",
        steps: [
          { title: "打开 Outlook Classic", body: "从开始菜单搜索 Outlook (Classic) 并打开。" },
          { title: "首次使用", body: "输入公司邮箱，点击“连接”，在弹出的 Microsoft 登录窗口中输入密码并完成验证。" },
          { title: "已经登录过其他账号", body: "点击“文件”→“添加账户”，输入公司邮箱并点击“连接”。" },
          { title: "完成设置", body: "等待 Outlook 完成配置，看到收件箱后即可使用。" },
        ],
      },
      {
        id: "shared-mailbox",
        kicker: "共享邮箱",
        title: "查看和使用分所邮箱",
        points: [
          "个人邮箱和已经授权的分所邮箱会显示在左侧文件夹区域。",
          "点击不同邮箱下的“收件箱”即可查看邮件。",
          "发送邮件时，打开“新建电子邮件”→“选项”→“…”→“发件人”。",
          "点击“发件人”→“其他电子邮件地址”，选择允许使用的分所邮箱。",
          "共享邮箱不需要单独登录或输入密码；看不到时应联系 IT 检查权限。",
        ],
      },
      {
        id: "compose",
        kicker: "邮件",
        title: "创建、发送和提及联系人",
        points: [
          "选择“新建电子邮件”，填写收件人、抄送、密件抄送和主题。",
          "输入正文并检查附件后，选择“发送”。",
          "在正文中输入 @ 加联系人姓名，可提醒对方并自动将其加入收件人。",
        ],
      },
      {
        id: "inbox",
        kicker: "收件箱",
        title: "重点收件箱与邮件整理",
        points: [
          "“重点”和“其他”选项卡用于区分重要程度。",
          "右键邮件可选择“移动到其他收件箱”或“移动到重点收件箱”。",
          "通过“视图”→“显示重点收件箱”可开关此功能。",
          "右键邮箱名称或收件箱，选择“新建文件夹”；邮件可直接拖入文件夹。",
          "右键常用文件夹并选择“添加到收藏夹”。",
        ],
      },
      {
        id: "calendar",
        kicker: "日历",
        title: "安排会议和使用日程安排助理",
        points: [
          "在日历中选择“新建约会”，填写主题、地点、开始和结束时间。",
          "选择“邀请与会者”可将约会变为会议，也可添加 Teams 在线会议。",
          "使用“日程安排助理”查看参与者和会议室的空闲时间。",
          "会议完成后选择“发送”；个人约会选择“保存并关闭”。",
        ],
      },
      {
        id: "recall",
        kicker: "补救操作",
        title: "尝试撤回邮件",
        steps: [
          { title: "打开已发送邮件", body: "进入“已发送邮件”，双击需要撤回的邮件，在独立窗口中打开。" },
          { title: "找到撤回选项", body: "点击左上角“文件”，选择撤回或重新发送相关选项。" },
        ],
        success: "撤回只可能在对方尚未阅读且对方同样使用 Microsoft 365 时成功；不能把撤回当成保证。",
      },
      {
        id: "contacts",
        kicker: "联系人",
        title: "搜索公司内部联系人",
        points: [
          "在新邮件的收件人栏输入姓名的一部分，Outlook 会显示匹配建议。",
          "也可点击“收件人”打开通讯簿，再按姓名搜索。",
          "选择正确联系人后再发送，避免误发给同名人员。",
        ],
      },
      {
        id: "mobile",
        kicker: "手机",
        title: "在手机上添加 Outlook",
        steps: [
          { title: "安装 Outlook", body: "在 App Store 或手机应用商店安装 Microsoft Outlook。" },
          { title: "添加账户", body: "选择“添加账户”，输入公司邮箱并继续。" },
          { title: "完成验证", body: "输入密码并按照提示完成多重身份验证。" },
        ],
      },
    ],
  },
  {
    slug: "teams",
    title: "Microsoft Teams 使用指引",
    subtitle: "安装 · 聊天 · 团队 · 会议 · 文件",
    category: "Teams",
    description: "安装并登录 Teams，使用聊天、频道、日历、会议和文件功能。",
    duration: "按需阅读",
    device: "电脑、手机或浏览器",
    keywords: ["Teams下载", "Teams登录", "聊天", "频道", "开会", "日程安排助理", "共享屏幕", "录制会议", "翻译消息", "延时发送"],
    completion: "可以登录 Teams、发送消息、查看所属团队并加入或安排会议。",
    prepare: [
      { label: "账号", text: "公司 Microsoft 365 邮箱和密码" },
      { label: "验证", text: "电话、Microsoft Authenticator 或公司指定验证器" },
      { label: "设备", text: "电脑建议安装桌面客户端；也可使用网页端" },
    ],
    sections: [
      {
        id: "install",
        kicker: "开始使用",
        title: "安装或打开 Teams",
        points: [
          "电脑端：访问 microsoft.com/microsoft-teams/download-app，下载 Windows 或 macOS 版本。",
          "移动端：在 App Store 或手机应用商店搜索 Microsoft Teams。",
          "网页端：访问 teams.microsoft.com，无需安装。",
          "鸿蒙系统不在 Microsoft 官方支持范围内，旧版本兼容安装可能出现无声音或无画面。",
        ],
      },
      {
        id: "sign-in",
        kicker: "登录",
        title: "使用公司账号登录",
        steps: [
          { title: "输入公司邮箱", body: "打开 Teams，输入公司 Microsoft 365 账号。" },
          { title: "输入密码并验证", body: "输入当前密码，使用电话或验证器完成多重身份验证。" },
          { title: "进入主界面", body: "确认左侧可以看到活动、聊天、团队、日历、通话和 OneDrive 等入口。" },
        ],
      },
      {
        id: "chat",
        kicker: "聊天",
        title: "发送消息和使用常用功能",
        points: [
          "点击“聊天”→“新消息”，输入联系人姓名开始一对一或群组聊天。",
          "消息支持文字、表情、GIF、文件、语音和视频。",
          "输入 @用户名 可以提醒指定人员。",
          "格式按钮可添加标题、列表和重点样式。",
          "右键或打开消息更多菜单，可使用转发、引用、固定和翻译。",
          "可设置重要消息或延时发送；延时发送时 Teams 应保持运行。",
        ],
      },
      {
        id: "teams-channels",
        kicker: "团队与频道",
        title: "查找部门内容和共享文件",
        points: [
          "“团队”中会显示您所属的分所或部门。",
          "每个团队可包含“常规”“项目讨论”等多个频道。",
          "频道可发布帖子并共享文件。",
          "是否能看到服务器或部门文件取决于管理员配置的权限。",
        ],
      },
      {
        id: "meetings",
        kicker: "会议",
        title: "安排和加入 Teams 会议",
        points: [
          "在“日历”中点击“新事件”，填写主题、时间和参与者。",
          "输入参与者后，可查看时间冲突；“日程安排助理”可显示更详细的空闲时间。",
          "打开会议条目并选择“加入”，加入前可设置麦克风、摄像头和背景。",
          "会议中可共享屏幕、聊天、举手、回应、录制和转录。",
          "录制文件通常保存在会议组织者的 OneDrive 中。",
        ],
      },
      {
        id: "learn",
        kicker: "官方资源",
        title: "继续学习",
        points: [
          "Microsoft Teams 培训中心：https://learn.microsoft.com/zh-cn/training/teams/",
          "Teams 功能导航：https://learn.microsoft.com/zh-cn/microsoftteams/navigate-teams",
        ],
      },
    ],
  },
  {
    slug: "onedrive",
    title: "OneDrive 使用指引",
    subtitle: "登录 · 同步 · 上传 · 下载 · 共享",
    category: "OneDrive 与 SharePoint",
    description: "在浏览器和电脑上使用 OneDrive，同步、上传、下载和共享公司文件。",
    duration: "按需阅读",
    device: "电脑或浏览器",
    keywords: ["OneDrive登录", "OneDrive不同步", "OneDrive 不同步", "文件不同步", "蓝色小云", "绿色小勾", "上传文件", "下载文件", "共享链接", "同步共享文件"],
    completion: "OneDrive 云朵图标状态正常，测试文件可上传并在网页端看到。",
    prepare: [
      { label: "账号", text: "公司 Microsoft 365 账号" },
      { label: "客户端", text: "Windows 11 通常已安装 OneDrive" },
      { label: "网络", text: "稳定互联网，首次同步可能耗时较长" },
    ],
    sections: [
      {
        id: "sign-in",
        kicker: "登录",
        title: "在网页或电脑上打开 OneDrive",
        points: [
          "网页版：登录 microsoft365.com，在应用启动器中选择 OneDrive；也可访问 onedrive.com。",
          "桌面端：在开始菜单搜索 OneDrive，输入公司账号并登录。",
          "首次登录时可选择需要同步的文件夹；不确定时保留默认设置。",
        ],
      },
      {
        id: "upload",
        kicker: "文件操作",
        title: "上传和下载文件",
        points: [
          "网页版上传：选择“上传”，再选择文件或文件夹。",
          "电脑上传：把文件拖入文件资源管理器左侧的 OneDrive 文件夹。",
          "蓝色小云变成绿色小勾，通常表示文件已经下载到本地并完成同步。",
          "网页版下载：右键文件选择“下载”。",
          "桌面端长期保留：右键文件选择“始终保留在此设备上”。",
        ],
      },
      {
        id: "share",
        kicker: "协作",
        title: "共享文件或文件夹",
        steps: [
          { title: "打开共享", body: "右键文件或文件夹，选择“共享”。" },
          { title: "选择人员和权限", body: "输入同事邮箱，并根据需要选择可编辑或仅查看。" },
          { title: "发送或复制链接", body: "点击“发送”，或复制链接后通过 Teams、Outlook 等方式发送。" },
          { title: "高级设置", body: "如果租户允许，可在链接设置中配置过期时间或其他限制。" },
        ],
      },
      {
        id: "status",
        kicker: "故障排查",
        title: "看懂同步状态",
        points: [
          "正常云朵图标：OneDrive 正在运行。",
          "红色叉号：点击 OneDrive 图标查看具体错误并修复。",
          "存储空间不足：删除不需要的文件或联系 IT。",
          "Attachments 文件夹通常保存 Teams 聊天附件；Recordings 通常保存由您发起的 Teams 会议录制。",
        ],
      },
      {
        id: "shared-save",
        kicker: "共享内容",
        title: "把别人分享的文件同步到电脑",
        steps: [
          { title: "打开分享邮件", body: "确认发件人与内容可信后，点击邮件中的“Open”打开共享位置。" },
          { title: "选择同步", body: "在网页顶部点击“同步 / Sync”，允许浏览器打开 OneDrive。" },
          { title: "等待完成", body: "同步完成后，共享文件会出现在文件资源管理器中。" },
        ],
      },
    ],
  },
  {
    slug: "sharepoint",
    title: "使用 SharePoint 共享和同步文件",
    subtitle: "访问站点 · 同步文档库 · 协作共享",
    category: "OneDrive 与 SharePoint",
    description: "访问公司 SharePoint 站点，把文档库同步到电脑，并与同事共享文件。",
    duration: "约 5–15 分钟",
    device: "电脑 + 浏览器",
    keywords: ["SharePoint", "共享文件", "同步文档库", "Documents", "红色圆圈", "蓝色云朵", "共享链接"],
    completion: "SharePoint 文档库出现在文件资源管理器中，测试文件可以正常同步。",
    prepare: [
      { label: "站点地址", text: "由站点负责人或 IT 提供的 SharePoint 链接" },
      { label: "账号", text: "有权限访问该站点的公司账号" },
      { label: "OneDrive", text: "电脑已安装并登录 OneDrive" },
    ],
    sections: [
      {
        id: "visit",
        kicker: "步骤一",
        title: "访问 SharePoint 文档库",
        steps: [
          { title: "打开站点链接", body: "在浏览器中打开站点负责人提供的 SharePoint 地址。" },
          { title: "登录并验证", body: "使用公司账号登录，输入密码并完成多重身份验证。" },
          { title: "打开文档", body: "在左侧导航栏点击“文档 / Documents”浏览文件和文件夹。" },
        ],
      },
      {
        id: "sync",
        kicker: "步骤二",
        title: "同步到本地电脑",
        steps: [
          { title: "点击“同步”", body: "在文档库顶部工具栏选择“同步”。" },
          { title: "允许打开 OneDrive", body: "浏览器询问是否打开 OneDrive 时，选择允许。" },
          { title: "等待文件夹就绪", body: "OneDrive 自动开始设置；看到文件夹已就绪后，可从文件资源管理器打开。" },
        ],
      },
      {
        id: "collaborate",
        kicker: "步骤三",
        title: "添加文件并与同事协作",
        points: [
          "把文件复制或移动到本地 SharePoint 同步文件夹。",
          "OneDrive 会自动把新增和修改上传到 SharePoint。",
          "绿色勾号表示已同步；蓝色云朵表示仅联机；蓝色圈圈表示同步中；红色圆圈表示错误。",
          "其他有权限的协作者会看到更新。",
          "需要主动通知某人时，可在网页右键文件选择“共享”，设置可编辑或仅查看后发送。",
        ],
        success: "测试文件显示绿色勾号，并且刷新 SharePoint 网页后可以看到。",
      },
    ],
  },
  {
    slug: "autopilot-new-pc",
    title: "新公司电脑首次登录",
    subtitle: "Autopilot · ESP · Windows PIN · 公司门户",
    category: "设备与工具",
    description: "在已注册 Autopilot 的全新 Windows 公司电脑上完成首次登录、设备配置和应用安装。",
    duration: "约 30–60 分钟",
    device: "全新 Windows 公司电脑",
    keywords: ["新电脑", "Autopilot", "ESP", "正在为组织设置设备", "Company Portal", "公司门户", "Windows PIN", "应用安装失败"],
    completion: "可以使用公司账号和 PIN 登录，ESP 已完成，公司门户和 Office、Teams、OneDrive 可正常使用。",
    prepare: [
      { label: "电源", text: "全程连接电源适配器" },
      { label: "网络", text: "稳定 Wi-Fi 或网线，避免需网页二次认证的网络" },
      { label: "账号", text: "公司账号、密码和可用验证器" },
    ],
    sections: [
      {
        id: "network",
        kicker: "步骤一",
        title: "启动并连接稳定网络",
        steps: [
          { title: "启动电脑", body: "按电源键，按照屏幕提示选择国家、地区和键盘布局。" },
          { title: "连接网络", body: "连接稳定 Wi-Fi 或插入网线，确认可以访问互联网。" },
        ],
      },
      {
        id: "account",
        kicker: "步骤二",
        title: "使用公司账号登录",
        steps: [
          { title: "输入工作或学校账号", body: "在组织登录页面输入公司邮箱和密码。" },
          { title: "完成验证", body: "根据页面提示使用 Microsoft Authenticator、腾讯身份验证器或其他已登记方式。" },
        ],
      },
      {
        id: "esp",
        kicker: "步骤三",
        title: "等待 ESP 完成设备配置",
        intro: "系统通常显示“正在为你的组织设置设备 / Setting up your device for work or school”。",
        points: [
          "系统会自动下发安全策略、Office、Edge、Defender、VPN 或业务应用。",
          "电脑可能自动重启一次或多次，属于正常现象。",
          "保持接电和联网，不要强制关机、恢复出厂设置或跳过组织页面。",
          "系统进入 Windows 登录界面或桌面，且没有持续错误代码，通常表示 ESP 已完成。",
        ],
      },
      {
        id: "pin",
        kicker: "步骤四",
        title: "设置 Windows Hello PIN",
        points: [
          "点击“设置 PIN”，必要时再次完成账号和验证器确认。",
          "PIN 只用于当前电脑本地登录，不等于公司账号密码。",
          "不要使用生日、手机号、123456 或容易猜到的组合。",
        ],
      },
      {
        id: "portal",
        kicker: "步骤五",
        title: "通过公司门户安装所需应用",
        steps: [
          { title: "等待后台同步", body: "进入桌面后先等待约 10–15 分钟。" },
          { title: "打开公司门户", body: "从开始菜单搜索“公司门户 / Company Portal”，使用公司账号登录。" },
          { title: "安装工作应用", body: "进入“应用 / Apps”，只安装当前工作需要的软件，等待状态变为“已安装”。" },
        ],
      },
      {
        id: "troubleshooting",
        kicker: "异常处理",
        title: "什么时候联系 IT",
        points: [
          "ESP 连续 60 分钟没有任何进度变化。",
          "页面显示应用安装失败、红色错误页或明确错误代码。",
          "联系 IT 时提供完整截图、准确时间、设备名称或序列号、账号、网络环境和已重启次数。",
          "Company Portal 应用失败时，提供应用名称和错误截图。",
        ],
      },
    ],
  },
  {
    slug: "scan-documents",
    title: "使用手机扫描文档",
    subtitle: "iPhone · 华为 · 小米",
    category: "设备与工具",
    description: "使用手机自带功能扫描纸质文件，并保存或分享为图片或 PDF。",
    duration: "约 2–5 分钟",
    device: "iPhone、华为或小米手机",
    keywords: ["手机扫描", "手机扫描PDF", "扫描文档", "扫描PDF", "iPhone扫描文稿", "华为文档矫正", "小米文档扫描", "Scan文件夹"],
    completion: "文档边缘清晰、方向正确，并已保存成图片或 PDF。",
    prepare: [
      { label: "环境", text: "光线充足、桌面平整" },
      { label: "文档", text: "纸张完整放在取景范围内" },
      { label: "检查", text: "分享前确认文字清晰且没有遗漏页面" },
    ],
    sections: [
      {
        id: "iphone",
        kicker: "iPhone",
        title: "使用“文件”App 扫描",
        steps: [
          { title: "打开扫描文稿", body: "打开“文件”App，点击右上角“更多”，选择“扫描文稿”。" },
          { title: "拍摄", body: "自动模式会自动扫描；手动模式可按快门或音量键。" },
          { title: "调整边缘", body: "拖动四角，使扫描范围与页面一致，然后选择“继续扫描”。" },
          { title: "保存和分享", body: "完成所有页面后点击“存储”。长按文件选择“共享”，通过允许的方式发送。" },
        ],
      },
      {
        id: "huawei",
        kicker: "华为",
        title: "使用文档矫正模式",
        points: [
          "打开相机→“更多”→“文档矫正”。",
          "找不到时，在“更多”中下载文档矫正模式。",
          "对准文档并拍照，系统会识别文字区域、矫正角度并减少阴影。",
          "检查结果后保存或分享。",
        ],
      },
      {
        id: "xiaomi",
        kicker: "小米",
        title: "使用文档扫描模式",
        points: [
          "打开相机→“更多”→“文档扫描”。",
          "找不到时，在“更多”中下载文档扫描模式。",
          "对准文档拍照，系统会尝试裁剪边缘。",
          "完成后可保存为 PDF，再通过允许的方式分享。",
        ],
      },
    ],
  },
  {
    slug: "password-reset",
    title: "自助重置公司账号密码",
    subtitle: "忘记密码 · 无法登录 · 多方式身份验证",
    category: "账号与安全",
    description: "无法登录 Microsoft 365 时，通过 Microsoft 密码重置页面完成两次身份验证并设置新密码。",
    duration: "约 5–10 分钟",
    device: "手机或电脑浏览器",
    keywords: ["忘记密码", "重置密码", "无法访问账号", "passwordreset", "接听电话", "私人邮箱", "办公室电话", "验证码"],
    completion: "新密码设置成功，并能使用它登录 Microsoft 365。",
    prepare: [
      { label: "账号", text: "完整的公司邮箱地址" },
      { label: "验证方式", text: "已登记的手机、办公室电话、私人邮箱或验证器" },
      { label: "浏览器", text: "建议使用 Edge、Chrome 或手机浏览器" },
    ],
    sections: [
      {
        id: "open",
        kicker: "步骤一",
        title: "打开微软密码重置页面",
        steps: [
          { title: "访问重置地址", body: "打开 https://passwordreset.microsoftonline.com/。也可从 Microsoft 登录页选择“无法访问你的账户”。" },
          { title: "输入账号和验证码", body: "输入完整公司邮箱，并填写页面图片验证码后点击“下一步”。" },
        ],
      },
      {
        id: "verify",
        kicker: "步骤二",
        title: "完成两种身份验证",
        intro: "页面会显示管理员允许且您已经登记的方式。通常需要完成两次验证。",
        points: [
          "手机或办公室电话：输入页面要求的完整号码，接听电话并按照语音提示按“#”键。",
          "私人邮箱：输入完整邮箱地址，接收并填写验证码。",
          "Microsoft Authenticator：按照手机和电脑上的数字匹配提示完成批准。",
          "其他验证器：打开应用，输入当前显示的 6 位动态验证码。",
        ],
      },
      {
        id: "new-password",
        kicker: "步骤三",
        title: "设置新密码",
        steps: [
          { title: "输入两次新密码", body: "按照页面要求设置新密码，并在确认框再次输入。" },
          { title: "完成后重新登录", body: "使用新密码登录 Microsoft 365；Outlook、Teams、OneDrive 和手机应用也应更新密码。" },
        ],
        success: "如果没有足够的验证方式、号码不正确或无法接收验证，应联系 IT 更新安全信息。",
      },
    ],
  },
];

export const categoryOrder: Guide["category"][] = [
  "账号与安全",
  "Office 应用",
  "Outlook 邮箱",
  "Teams",
  "OneDrive 与 SharePoint",
  "设备与工具",
];
