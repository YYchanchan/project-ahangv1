<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { resolveMediaUrl } from "../services/api";
import type { ProfileStats, User, UserRole } from "../types";
import AhangIcon from "./AhangIcon.vue";

const props = defineProps<{
  user: User;
  wechatLoading: boolean;
  profileStats: ProfileStats;
  taskCount: number;
}>();

const emit = defineEmits<{
  wechatLogin: [];
  logout: [];
  submissions: [];
  favorites: [];
  tasks: [];
  settings: [];
  notify: [message: string];
}>();

const avatarFailed = ref(false);
const avatarSource = computed(() => resolveMediaUrl(props.user.avatarUrl));
watch(
  () => [props.user.id, props.user.avatarUrl],
  () => {
    avatarFailed.value = false;
  },
);

const roleLabel = computed(() => {
  const labels: Record<UserRole, string> = {
    guest: "游客",
    contributor: "公众贡献者",
    reviewer: "守护人 / 审核员",
    admin: "管理员",
  };
  return labels[props.user.role];
});

const stats = computed(() => [
  { value: `${props.profileStats.submissionCount}次`, label: "记录" },
  { value: `${props.profileStats.approvedContributionCount}条`, label: "通过资料" },
  { value: `${props.profileStats.favoriteCount}只`, label: "收藏动物" },
]);

</script>

<template>
  <view class="profile-page">
    <view class="profile-card">
      <view class="profile-card__top">
        <view class="profile-avatar">
          <image
            v-if="avatarSource && !avatarFailed"
            :src="avatarSource"
            mode="aspectFill"
            @error="avatarFailed = true"
          />
          <text v-else>{{ user.nickname ? user.nickname.charAt(0) : "游" }}</text>
        </view>
        <view class="profile-identity">
          <text>{{ user.nickname }}</text>
          <text>{{ roleLabel }}</text>
          <text v-if="user.role === 'guest'">点击右侧按钮快捷登录</text>
          <text v-else>
            账号状态：{{ user.status === "active" ? "正常" : user.status === "pending" ? "待审核" : "已停用" }} · ID: {{ user.id }}
          </text>
        </view>
        <button v-if="user.role === 'guest'" class="login-button" :loading="wechatLoading" @click="emit('wechatLogin')">
          微信登录 / Login
        </button>
        <button v-else class="wechat-bind" :loading="wechatLoading" @click="emit('wechatLogin')">编辑资料</button>
      </view>

      <view class="profile-stats">
        <view v-for="stat in stats" :key="stat.label">
          <text>{{ stat.value }}</text><text>{{ stat.label }}</text>
        </view>
      </view>
    </view>

    <view class="profile-menu">
      <button v-if="user.role !== 'guest'" @click="emit('wechatLogin')"><view><AhangIcon name="users" :size="18" /><text>头像与昵称</text></view><text>编辑 ›</text></button>
      <button @click="emit('submissions')"><view><AhangIcon name="file" :size="18" /><text>我的投稿</text></view><text>待审核 {{ profileStats.pendingCount }} ›</text></button>
      <button @click="emit('favorites')"><view><AhangIcon name="heart" :size="18" /><text>我的收藏</text></view><text>›</text></button>
      <button @click="emit('submissions')"><view><AhangIcon name="pin" :size="18" /><text>我的观察足迹</text></view><text>{{ profileStats.submissionCount }} 条 ›</text></button>
      <button @click="emit('submissions')"><view><AhangIcon name="activity" :size="18" /><text>我的贡献</text></view><text>{{ profileStats.approvedContributionCount }} 条 ›</text></button>
      <button @click="emit('tasks')"><view><AhangIcon name="help" :size="18" /><text>待我补充</text></view><text>{{ taskCount }} 个任务 ›</text></button>
      <button @click="emit('notify', '版权授权：您已签署《公众数字档案共享协议》，提交资料免费用于动物科普')"><view><AhangIcon name="shield" :size="18" /><text>版权与授权</text></view><text>›</text></button>
      <button @click="emit('notify', '协作者申请：您的资料已提交审核，审核通过后可直接编辑动物档案')"><view><AhangIcon name="users" :size="18" /><text>申请档案协作者</text></view><text>›</text></button>
      <button @click="emit('settings')"><view><AhangIcon name="settings" :size="18" /><text>设置与帮助</text></view><text>›</text></button>
    </view>

    <button v-if="user.role !== 'guest'" class="logout-button" @click="emit('logout')">
      <AhangIcon name="logout" :size="16" /> 退出登录 / Log Out
    </button>

    <view class="profile-footer">
      <text>PROJECT AHANG</text>
      <text>公众共建的在园动物数字守护平台</text>
    </view>
  </view>
</template>

<style scoped>
button {
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  line-height: 1.2;
}

button::after {
  display: none;
}

.profile-page {
  display: flex;
  flex-direction: column;
  gap: 13px;
  padding: 16px 20px 100px;
}

.profile-card,
.profile-menu,
.role-demo {
  border: 1px solid rgba(214, 211, 209, 0.75);
  border-radius: 17px;
  background: #fff;
  box-shadow: 0 3px 12px rgba(41, 37, 36, 0.05);
}

.profile-card {
  padding: 15px;
}

.profile-card__top {
  display: flex;
  gap: 11px;
  align-items: center;
}

.profile-avatar {
  display: flex;
  width: 52px;
  height: 52px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 2px solid rgba(217, 195, 176, 0.55);
  border-radius: 50%;
  background: #2f5233;
  color: #fff;
  font-family: Georgia, serif;
  font-size: 18px;
}

.profile-avatar image {
  width: 100%;
  height: 100%;
}

.profile-identity {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 3px;
}

.profile-identity > text:first-child {
  color: #1c1917;
  font-family: Georgia, "Songti SC", serif;
  font-size: 16px;
  font-weight: 700;
}

.profile-identity > text:nth-child(2) {
  align-self: flex-start;
  padding: 2px 6px;
  border-radius: 999px;
  background: rgba(47, 82, 51, 0.08);
  color: #2f5233;
  font-size: 8px;
  font-weight: 700;
}

.profile-identity > text:last-child {
  overflow: hidden;
  color: #a8a29e;
  font-size: 8px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.login-button {
  padding: 7px 9px;
  border-radius: 9px;
  background: #2f5233;
  color: #fff;
  font-size: 8px;
  font-weight: 700;
}

.wechat-bind {
  padding: 6px 9px;
  border: 1px solid #86c66a;
  border-radius: 9px;
  background: #f0faeb;
  color: #2f6f26;
  font-size: 8px;
  font-weight: 700;
}

.profile-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin-top: 14px;
  padding-top: 13px;
  border-top: 1px solid #f0ece7;
}

.profile-stats > view {
  display: flex;
  flex-direction: column;
  gap: 3px;
  text-align: center;
}

.profile-stats > view:not(:last-child) {
  border-right: 1px solid #f0ece7;
}

.profile-stats text:first-child {
  color: #1c1917;
  font-family: Georgia, serif;
  font-size: 17px;
  font-weight: 700;
}

.profile-stats text:last-child {
  color: #a8a29e;
  font-size: 8px;
}

.workspace-entry {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  padding: 13px 14px;
  border-radius: 14px;
}

.workspace-entry > view {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 3px;
}

.workspace-entry > view text:first-child {
  font-size: 11px;
  font-weight: 700;
}

.workspace-entry > view text:last-child {
  font-size: 8px;
  line-height: 1.45;
  opacity: 0.72;
}

.workspace-entry button {
  font-size: 8px;
  font-weight: 700;
}

.workspace-entry--reviewer {
  border: 1px solid rgba(47, 82, 51, 0.25);
  background: rgba(47, 82, 51, 0.07);
  color: #2f5233;
}

.workspace-entry--admin {
  background: #1c1917;
  color: #fff;
}

.profile-menu {
  overflow: hidden;
}

.profile-menu > button {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  padding: 13px 14px;
  color: #57534e;
}

.profile-menu > button:not(:last-child) {
  border-bottom: 1px solid #f5f5f4;
}

.profile-menu > button > view {
  display: flex;
  align-items: center;
  gap: 9px;
}

.profile-menu > button > view text {
  color: #44403c;
  font-size: 10px;
  font-weight: 600;
}

.profile-menu > button > text {
  color: #a8a29e;
  font-size: 8px;
}

.logout-button {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 11px;
  border: 1px solid rgba(184, 59, 38, 0.25);
  border-radius: 11px;
  color: #b83b26;
  font-size: 9px;
  font-weight: 700;
}

.role-demo {
  padding: 14px;
  border-style: dashed;
  background: #fafaf9;
}

.role-demo__title {
  display: flex;
  gap: 7px;
  align-items: center;
}

.role-demo__title > view {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.role-demo__title > view text:first-child {
  color: #44403c;
  font-size: 10px;
  font-weight: 700;
}

.role-demo__title > view text:last-child {
  color: #b83b26;
  font-size: 7px;
}

.role-demo > text {
  display: block;
  padding-top: 8px;
  color: #78716c;
  font-size: 8px;
  line-height: 1.5;
}

.role-demo__buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 5px;
  padding-top: 10px;
}

.role-demo__buttons button {
  padding: 7px 2px;
  border: 1px solid #e7e5e4;
  border-radius: 8px;
  background: #fff;
  color: #78716c;
  font-size: 8px;
}

.role-demo__buttons button.active {
  border-color: #2f5233;
  background: #2f5233;
  color: #fff;
}

.profile-footer {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 8px;
  color: #a8a29e;
  font-size: 8px;
  text-align: center;
}
</style>
