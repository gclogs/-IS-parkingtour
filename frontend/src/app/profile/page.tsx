import React from "react";
import { UserIcon, MapPinIcon, HeartIcon, ChatBubbleLeftIcon } from "@heroicons/react/24/outline";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from "@/components/ui";

function ProfileStats() {
  const stats = [
    { label: "등록한 마커", value: "12", icon: MapPinIcon, color: "text-blue-600" },
    { label: "받은 좋아요", value: "48", icon: HeartIcon, color: "text-red-500" },
    { label: "작성한 댓글", value: "23", icon: ChatBubbleLeftIcon, color: "text-green-600" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="text-center">
          <CardContent className="pt-6">
            <div className="flex justify-center mb-2">
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RecentActivity() {
  const activities = [
    { type: "marker", content: "전주 한옥마을 근처 맛집을 추가했습니다", time: "2시간 전" },
    { type: "like", content: "부산 해운대 주차장 정보에 좋아요를 받았습니다", time: "5시간 전" },
    { type: "comment", content: "서울 명동 쇼핑몰에 댓글을 작성했습니다", time: "1일 전" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>최근 활동</CardTitle>
        <CardDescription>최근 7일간의 활동 내역입니다</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div
              key={index}
              className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{activity.content}</p>
                <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProfilePage() {
  // 임시 사용자 데이터
  const user = {
    anonymousName: "여행러버123",
    avatarUrl: "/api/placeholder/avatar", // 실제로는 생성된 아바타 URL
    joinDate: "2024년 1월",
    level: "활발한 탐험가",
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* 프로필 헤더 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-6">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                <UserIcon className="h-10 w-10 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900">{user.anonymousName}</h1>
              <p className="text-sm text-gray-500 mt-1">{user.level}</p>
              <p className="text-sm text-gray-500">{user.joinDate}부터 함께하고 있습니다</p>
              <div className="mt-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  개인정보 보호를 위해 익명으로 표시됩니다
                </span>
              </div>
            </div>
            <div className="flex-shrink-0">
              <Button variant="secondary" size="sm">
                설정
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 통계 */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">내 활동 통계</h2>
        <ProfileStats />
      </div>

      {/* 최근 활동 */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">최근 활동</h2>
        <RecentActivity />
      </div>

      {/* 빠른 액션 */}
      <Card>
        <CardHeader>
          <CardTitle>빠른 액션</CardTitle>
          <CardDescription>자주 사용하는 기능들에 빠르게 접근하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center space-y-2">
              <MapPinIcon className="h-6 w-6" />
              <span className="text-sm">새 마커 추가</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center space-y-2">
              <HeartIcon className="h-6 w-6" />
              <span className="text-sm">좋아요한 장소</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center space-y-2">
              <ChatBubbleLeftIcon className="h-6 w-6" />
              <span className="text-sm">내 댓글</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center space-y-2">
              <UserIcon className="h-6 w-6" />
              <span className="text-sm">계정 설정</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
