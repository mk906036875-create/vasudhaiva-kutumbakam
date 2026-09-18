/* ==========================================
   PROFILE PHOTO
========================================== */

async function uploadAvatar(input){

  if(!currentUser){
    toast("पहले Login करें");
    return;
  }

  const file = input.files && input.files[0];

  if(!file) return;

  if(!file.type.startsWith("image/")){
    toast("सिर्फ Image चुनें");
    input.value = "";
    return;
  }

  if(file.size > 5 * 1024 * 1024){
    toast("Photo 5MB से कम रखें");
    input.value = "";
    return;
  }

  try{

    const ext =
      (file.name.split(".").pop() || "jpg")
      .toLowerCase();

    const path =
      currentUser.id +
      "/avatar-" +
      Date.now() +
      "." +
      ext;

    const {
      error: uploadError
    } =
    await supabaseClient
      .storage
      .from("avatars")
      .upload(
        path,
        file,
        {
          cacheControl: "3600",
          upsert: false
        }
      );

    if(uploadError){

      console.error(uploadError);

      toast(
        "Photo Upload Error: " +
        uploadError.message
      );

      return;
    }

    const { data } =
      supabaseClient
        .storage
        .from("avatars")
        .getPublicUrl(path);

    const url = data.publicUrl;

    const {
      data: updateData,
      error: updateError
    } =
    await supabaseClient
      .auth
      .updateUser({
        data: {
          avatar_url: url
        }
      });

    if(updateError){

      console.error(updateError);

      toast(
        "Profile Save Error: " +
        updateError.message
      );

      return;
    }

    if(updateData?.user){

      currentUser =
        updateData.user;

    }

    showAvatar(url);

    toast(
      "Profile Photo अपडेट हो गई ✓"
    );

  }catch(error){

    console.error(error);

    toast(
      "Photo Error: " +
      error.message
    );

  }finally{

    input.value = "";

  }
}


/* ==========================================
   SHOW AVATAR
========================================== */

function showAvatar(url){

  const img =
    document.getElementById(
      "profileAvatarImg"
    );

  const fallback =
    document.getElementById(
      "profileAvatar"
    );

  if(!img || !fallback) return;

  if(url){

    img.src = url;

    img.style.display =
      "block";

    fallback.style.display =
      "none";

  }else{

    img.style.display =
      "none";

    fallback.style.display =
      "flex";

  }

}
/* ==========================================
   SAVE USER PROFILE
========================================== */

async function saveUserProfile(){

  if(!currentUser){
    return;
  }

  const email =
    currentUser.email || "";

  const username =
    email.split("@")[0];

  const avatarUrl =
    currentUser.user_metadata?.avatar_url || "";

  const { error } =
    await supabaseClient
      .from("profiles")
      .upsert({
        user_id: currentUser.id,
        username: username,
        avatar_url: avatarUrl
      });

  if(error){
    console.error(
      "Profile Save Error:",
      error
    );
  }
}
