/**
 * Helper file that abstracts functionality for uploading images to Supabase storage.
 **/

import { Subject } from "@/server/models/auth";
import { SupabaseClient } from "@supabase/supabase-js";

export const uploadPostFileToSupabase = async (
  supabase: SupabaseClient,
  subject: Subject,
  file: File,
  onSuccess: (attachmentUrl: string) => void,
  onError?: (error: Error) => void,
) => {
  const currentTimestamp = Date.now().toLocaleString();
  const { data: fileData, error: uploadError } = await supabase.storage
    .from("module-resources")
    .upload(`upload_${subject.id}_${currentTimestamp}`, file);

  if (uploadError) {
    console.error({
      code: "INTERNAL_SERVER_ERROR",
      message: `Failed to upload file to Supabase: ${uploadError.message}`,
    });
    if (onError) onError(uploadError);
  } else if (fileData) {
    onSuccess(fileData.path);
  }
};

export const uploadAvatarFileToSupabase = async (
  supabase: SupabaseClient,
  subject: Subject,
  file: File,
  onSuccess: (avatarUrl: string) => void,
  onError?: (error: Error) => void,
) => {
  const uniqueFileName = `${subject.id}_${Date.now()}`;

  const { data: fileData, error: uploadError } = await supabase.storage
    .from(`avatars`)
    .upload(uniqueFileName, file, { upsert: true });

  if (uploadError) {
    console.error({
      code: "INTERNAL_SERVER_ERROR",
      message: `Failed to upload file to Supabase: ${uploadError.message}`,
    });
    if (onError) onError(uploadError);
  } else if (fileData) {
    onSuccess(fileData.path);
  }
};
