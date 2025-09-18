"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { Star, ArrowLeft, MapPin, Upload, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { convex, isConvexConfigured } from "@/lib/convexClient";
import { api } from "@/convex/_generated/api";

interface MarkerFormData {
  name: string;
  category: string;
  description: string;
  rating: number;
  images: File[];
}

// CreateMarkerPage 컴포넌트를 별도로 분리
function CreateMarkerPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL에서 위치 정보 가져오기
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  const [formData, setFormData] = useState<MarkerFormData>({
    name: "",
    category: "",
    description: "",
    rating: 0,
    images: [],
  });

  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 별점 컴포넌트
  const StarRating = ({
    rating,
    onRatingChange,
  }: {
    rating: number;
    onRatingChange: (rating: number) => void;
  }) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            className={`p-1 transition-colors ${
              star <= rating ? "text-yellow-400" : "text-gray-300"
            } hover:text-yellow-400`}
          >
            <Star className="w-6 h-6 fill-current" />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">
          {rating > 0 ? `${rating}점` : "평점을 선택해주세요"}
        </span>
      </div>
    );
  };

  // 이미지 업로드 핸들러
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (formData.images.length + files.length > 3) {
      toast.error("최대 3장까지 업로드 가능합니다.");
      return;
    }

    const newImages = [...formData.images, ...files];
    setFormData((prev) => ({ ...prev, images: newImages }));

    // 미리보기 이미지 생성
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImages((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  // 이미지 제거 핸들러
  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    const newPreviews = previewImages.filter((_, i) => i !== index);

    setFormData((prev) => ({ ...prev, images: newImages }));
    setPreviewImages(newPreviews);
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.description) {
      toast.error("모든 필수 항목을 입력해주세요.");
      return;
    }

    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (!lat || !lng) {
      toast.error("위치 정보가 없습니다. 지도에서 위치를 선택해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      const newMarkerPayload = {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        rating: formData.rating,
        lat: parseFloat(lat), // 직접 lat, lng 전달
        lng: parseFloat(lng), // 직접 lat, lng 전달
        position: { lat: parseFloat(lat), lng: parseFloat(lng) }, // 호환성 유지
        address: `위도: ${parseFloat(lat).toFixed(4)}, 경도: ${parseFloat(lng).toFixed(4)}`,
      };

      if (typeof window !== 'undefined' && isConvexConfigured) {
        // Convex에 저장 (클라이언트 사이드에서만)
        const created = await convex.mutation(api.markers.create, newMarkerPayload);

        toast.success("마커가 성공적으로 생성되었습니다! 🎉");
        router.push(`/?lat=${lat}&lng=${lng}&zoom=15&newMarker=${created?._id ?? "1"}`);
      } else {
        // 설정 전까지는 로컬 저장소에 저장 (임시) 또는 서버 사이드 렌더링 시
        const tempMarker = {
          id: Date.now(),
          ...newMarkerPayload,
          images: previewImages,
          author: "익명 사용자",
          createdAt: new Date().toISOString(),
        };
        
        if (typeof window !== 'undefined') {
          const existingMarkers = JSON.parse(localStorage.getItem("userMarkers") || "[]");
          const updatedMarkers = [...existingMarkers, tempMarker];
          localStorage.setItem("userMarkers", JSON.stringify(updatedMarkers));
          
          toast.success("환경변수 설정 전까지 임시로 저장했습니다. Convex 설정 후 다시 시도하세요.");
          router.push(`/?lat=${lat}&lng=${lng}&zoom=15&newMarker=${tempMarker.id}`);
        }
      }
    } catch (error) {
      console.error(error);
      if (typeof window !== 'undefined') {
        toast.error("마커 생성에 실패했습니다. 다시 시도해주세요.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            뒤로가기
          </button>
        </div>

        {/* 메인 카드 */}
        <Card className="max-w-2xl mx-auto shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl font-bold flex items-center justify-center">
              <MapPin className="w-6 h-6 mr-2" />새 마커 생성
            </CardTitle>
            <CardDescription className="text-blue-100">
              {lat && lng
                ? `위치: ${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`
                : "위치 정보를 불러오는 중..."}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 장소명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  장소명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="예: 맛있는 파스타집"
                />
              </div>

              {/* 카테고리 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  카테고리 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">카테고리를 선택해주세요</option>
                  <option value="restaurant">🍽️ 음식점</option>
                  <option value="tourist">🏛️ 관광지</option>
                  <option value="parking">🅿️ 주차장</option>
                  <option value="cafe">☕ 카페</option>
                  <option value="shopping">🛍️ 쇼핑</option>
                  <option value="other">📍 기타</option>
                </select>
              </div>

              {/* 평점 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  평점 <span className="text-red-500">*</span>
                </label>
                <StarRating
                  rating={formData.rating}
                  onRatingChange={(rating) => setFormData((prev) => ({ ...prev, rating }))}
                />
              </div>

              {/* 설명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  설명 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  rows={3}
                  placeholder="이 장소에 대한 설명을 입력하세요 (선택사항)"
                />
              </div>

              {/* 이미지 업로드 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  사진 업로드 (최대 3장)
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <Upload className="w-5 h-5 mr-2" />
                    이미지 선택
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                  </label>
                  <span className="text-sm text-gray-500">PNG, JPG (최대 3장)</span>
                </div>

                {/* 미리보기 */}
                {previewImages.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    {previewImages.map((src, index) => (
                      <div key={index} className="relative">
                        <Image
                          src={src}
                          alt={`미리보기 ${index + 1}`}
                          width={200}
                          height={200}
                          className="rounded-lg object-cover w-full h-32"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-white/80 hover:bg-white text-gray-700 rounded-full p-1 shadow"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? "생성 중..." : "마커 생성"}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// 메인 export 컴포넌트에 Suspense 추가
export default function CreateMarkerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">페이지를 로딩 중입니다...</p>
      </div>
    </div>}>
      <CreateMarkerPageContent />
    </Suspense>
  );
}
