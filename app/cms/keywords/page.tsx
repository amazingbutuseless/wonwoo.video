"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import * as Firestore from "firebase/firestore/lite";
import Image from "next/image";

import { db } from "@/lib/firebase";
import { getKeywords, Keyword } from "@/lib/keyword/index";

type AlertType = "success" | "info" | "error";
type AlertState = {
  type: AlertType;
  message: string;
} | null;

const keywordSchema = z.object({
  value: z.string().trim().min(1, "키워드를 입력해주세요"),
});

const formSchema = z.object({
  id: z.string().trim().min(1, "비디오 ID를 입력해주세요"),
  keywords: z
    .array(keywordSchema)
    .min(1, "최소 1개 이상의 키워드가 필요합니다")
    .refine((keywords) => keywords.some((k) => k.value.trim().length > 0), {
      message: "최소 1개 이상의 유효한 키워드를 입력해주세요",
    }),
  translated: z.record(z.string(), z.record(z.string(), z.string())).optional(),
});

type KeywordsData = z.infer<typeof formSchema>;

const KeywordsPage = () => {
  const [step, setStep] = useState<"id" | "keywords">("id");
  const [isLoading, setIsLoading] = useState(false);
  const [existingData, setExistingData] = useState<Keyword | null>(null);
  const [alert, setAlert] = useState<AlertState>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const formMethods = useForm<KeywordsData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: "",
      keywords: [{ value: "" }],
      translated: {},
    },
    mode: "onSubmit",
  });

  const {
    formState: { errors, isSubmitting, dirtyFields },
    control,
    register,
    watch,
    setError,
    clearErrors,
    reset,
  } = formMethods;

  const videoId = watch("id");

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "keywords",
  });

  const isKeywordsChanged = useCallback(() => {
    return !!dirtyFields.keywords;
  }, [dirtyFields.keywords]);

  const handleKeywordInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const value = e.target.value;

    if (value.endsWith(",")) {
      const newValue = value.slice(0, -1).trim();
      formMethods.setValue(`keywords.${index}.value`, newValue, {
        shouldDirty: true,
      });
      append({ value: "" });

      setTimeout(() => {
        if (inputRefs.current[index + 1]) {
          inputRefs.current[index + 1]?.focus();
        }
      }, 10);
    }
  };

  const handleRemoveKeyword = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const showAlert = (type: AlertType, message: string) => {
    setAlert({ type, message });
    if (type === "success") {
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const clearAlert = () => setAlert(null);

  const handleNext = async () => {
    if (!videoId || videoId.trim() === "") {
      setError("id", {
        type: "manual",
        message: "비디오 ID를 입력해주세요",
      });
      return;
    }

    setIsLoading(true);
    clearErrors();
    clearAlert();

    try {
      const data = await getKeywords(videoId.trim());

      if (data) {
        setExistingData(data);

        // 먼저 키워드 배열 준비
        const keywordsArray =
          data.keywords && Array.isArray(data.keywords)
            ? data.keywords.map((k: string) => ({ value: k }))
            : [{ value: "" }];

        // fields 상태 직접 업데이트
        replace(keywordsArray);

        // 그 다음 폼 상태 리셋
        reset(
          {
            id: videoId,
            keywords: keywordsArray,
            translated: data.translated || {},
          },
          {
            keepDirty: false,
            keepValues: true,
          }
        );

        setStep("keywords");
        showAlert(
          "info",
          "기존 키워드를 불러왔습니다. 필요시 수정 후 저장하세요."
        );
      } else {
        replace([{ value: "" }]);
        reset({
          id: videoId,
          keywords: [{ value: "" }],
          translated: {},
        });
        setExistingData(null);
        setStep("keywords");
        showAlert("info", "새로운 키워드를 등록합니다.");
      }
    } catch (error) {
      console.error("데이터 조회 오류:", error);
      setError("root", {
        type: "server",
        message: "데이터 조회 중 오류가 발생했습니다.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: KeywordsData) => {
    try {
      clearErrors();
      clearAlert();

      const filteredKeywords = data.keywords
        .map((k) => k.value.trim())
        .filter(Boolean);

      const keywordsDoc: Partial<Keyword> = {};

      const hasKeywordsChanged = isKeywordsChanged();

      if (!hasKeywordsChanged) {
        keywordsDoc.translated = data.translated || {};
      } else {
        keywordsDoc.keywords = filteredKeywords;
        if (existingData?.translated) {
          showAlert("info", "키워드가 변경되어 번역 데이터는 재생성 됩니다.");
        }
      }

      await Firestore.setDoc(
        Firestore.doc(db, "vo_keywords", data.id.trim()),
        keywordsDoc,
        { merge: true }
      );

      showAlert("success", "키워드가 성공적으로 저장되었습니다.");

      reset(
        {
          id: data.id,
          keywords: filteredKeywords.map((k) => ({ value: k })),
          translated: !hasKeywordsChanged ? data.translated || {} : {},
        },
        {
          keepDirty: false,
        }
      );
    } catch (error) {
      console.error("키워드 저장 오류:", error);
      setError("root", {
        type: "server",
        message: "키워드 저장 중 오류가 발생했습니다.",
      });
    }
  };

  const handleTranslationChange = (
    keywordIdx: string,
    lang: string,
    value: string
  ) => {
    const currentTranslations = formMethods.getValues("translated") || {};
    const keywordTranslations = currentTranslations[keywordIdx] || {};

    formMethods.setValue("translated", {
      ...currentTranslations,
      [keywordIdx]: {
        ...keywordTranslations,
        [lang]: value,
      },
    });
  };

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, fields.length);
  }, [fields]);

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 md:px-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          키워드 관리
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          비디오 키워드를 추가하거나 수정하세요
        </p>
      </header>

      {alert && (
        <div
          className={`mb-6 p-4 rounded-lg shadow-sm ${
            alert.type === "success"
              ? "bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-l-4 border-green-500"
              : alert.type === "info"
              ? "bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-l-4 border-blue-500"
              : "bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-l-4 border-red-500"
          }`}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-3">
              {alert.type === "success" ? (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : alert.type === "info" ? (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <span>{alert.message}</span>
          </div>
        </div>
      )}

      {errors.root?.message && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-l-4 border-red-500">
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-3">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span>{errors.root.message}</span>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <FormProvider {...formMethods}>
          <form onSubmit={formMethods.handleSubmit(handleSubmit)}>
            {step === "id" ? (
              <div className="p-6">
                <div className="max-w-md mx-auto">
                  <label
                    htmlFor="id"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    비디오 ID
                  </label>
                  <div className="flex gap-3">
                    <input
                      {...register("id")}
                      className={`flex-1 border ${
                        errors.id
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      } rounded-lg px-4 py-2.5 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
                      placeholder="비디오 ID를 입력하세요"
                    />
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={handleNext}
                      className={`px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        isLoading ? "opacity-70 cursor-not-allowed" : ""
                      }`}
                    >
                      {isLoading ? "로딩 중..." : "다음"}
                    </button>
                  </div>
                  {errors.id && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                      {errors.id.message}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="border-b border-gray-200 dark:border-gray-700 p-5 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                  <h2 className="text-lg font-semibold">
                    비디오 ID:{" "}
                    <span className="text-blue-600 dark:text-blue-400 font-mono">
                      {videoId}
                    </span>
                  </h2>
                  <button
                    type="button"
                    onClick={() => setStep("id")}
                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 flex items-center"
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    ID 변경
                  </button>
                </div>

                <div className="p-6 space-y-8">
                  <section>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-md font-medium text-gray-700 dark:text-gray-300">
                        키워드
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                        각 키워드 입력 후 쉼표(,)를 입력하면 새 입력란이
                        추가됩니다
                      </span>
                    </div>

                    <div className="space-y-3">
                      {fields.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-2">
                          <div className="flex-1">
                            <input
                              {...register(`keywords.${index}.value`)}
                              ref={(e) => {
                                const { ref } = register(
                                  `keywords.${index}.value`
                                );
                                ref(e);
                                inputRefs.current[index] = e;
                              }}
                              onChange={(e) =>
                                handleKeywordInputChange(e, index)
                              }
                              className={`w-full border ${
                                errors.keywords?.[index]
                                  ? "border-red-500"
                                  : "border-gray-300 dark:border-gray-600"
                              } rounded-lg px-4 py-2.5 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
                              placeholder="키워드 입력 후 쉼표(,) 입력"
                            />
                            {errors.keywords?.[index]?.value && (
                              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                {errors.keywords[index]?.value?.message}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveKeyword(index)}
                            className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 transition-colors"
                            disabled={fields.length <= 1}
                            title="키워드 삭제"
                          >
                            <Image
                              src="/close.svg"
                              alt="삭제"
                              width={16}
                              height={16}
                            />
                          </button>
                        </div>
                      ))}
                    </div>

                    {errors.keywords && !Array.isArray(errors.keywords) && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                        {errors.keywords.message}
                      </p>
                    )}

                    {isKeywordsChanged() && existingData?.translated && (
                      <div className="mt-4 p-3 bg-amber-50 border-l-4 border-amber-500 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-500 rounded-md">
                        <div className="flex items-start">
                          <svg
                            className="w-5 h-5 mr-2 mt-0.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <div>
                            <p className="font-medium">키워드 변경 감지됨</p>
                            <p className="text-sm mt-1">
                              키워드가 변경되면 번역 데이터가 무시됩니다. 번역은
                              키워드 저장 후 다시 생성해야 합니다.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </section>

                  {existingData?.translated && (
                    <section
                      className={`bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-200 dark:border-gray-700 ${
                        isKeywordsChanged() ? "opacity-70" : ""
                      }`}
                    >
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium text-gray-800 dark:text-gray-200">
                            번역된 키워드
                          </h3>
                          {isKeywordsChanged() && (
                            <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 rounded-full">
                              읽기 전용
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {isKeywordsChanged()
                            ? "키워드 변경 시 번역 데이터는 저장되지 않습니다. 키워드 저장 후 다시 번역을 생성하세요."
                            : "기존에 등록된 번역 키워드를 수정할 수 있습니다"}
                        </p>
                      </div>

                      <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(existingData.translated).map(
                            ([keywordIdx, value]) => {
                              const idx = parseInt(keywordIdx, 10);
                              const keyword = existingData.keywords[idx];

                              if (!keyword) return null;

                              return (
                                <div
                                  key={`translation-${keywordIdx}`}
                                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                                >
                                  <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/30 border-b border-gray-200 dark:border-gray-700">
                                    <h4 className="font-medium text-blue-700 dark:text-blue-300">
                                      {keyword}
                                    </h4>
                                  </div>
                                  <div className="p-3 space-y-2">
                                    {Object.entries(value).map(
                                      ([lang, translatedValue]) => (
                                        <div
                                          key={`${lang}-${keywordIdx}`}
                                          className="flex items-center gap-3"
                                        >
                                          <span className="font-medium text-gray-600 dark:text-gray-400 min-w-[40px] text-sm uppercase">
                                            {lang}
                                          </span>
                                          <input
                                            type="text"
                                            className={`flex-1 border ${
                                              isKeywordsChanged()
                                                ? "bg-gray-100 dark:bg-gray-800"
                                                : "border-gray-300 dark:border-gray-600"
                                            } rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
                                            defaultValue={translatedValue}
                                            readOnly={isKeywordsChanged()}
                                            onChange={(e) =>
                                              !isKeywordsChanged() &&
                                              handleTranslationChange(
                                                keywordIdx,
                                                lang,
                                                e.target.value
                                              )
                                            }
                                          />
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>
                    </section>
                  )}
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                      }`}
                    >
                      {isSubmitting
                        ? "저장 중..."
                        : existingData
                        ? "키워드 수정"
                        : "키워드 저장"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </form>
        </FormProvider>
      </div>
    </div>
  );
};

export default KeywordsPage;
