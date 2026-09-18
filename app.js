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
/* ==========================================
   EDIT PROFILE
========================================== */

function openEditProfile(){

  if(!currentUser){
    toast("पहले Login करें");
    return;
  }

  const name =
    currentUser.user_metadata?.display_name ||
    currentUser.email?.split("@")[0] ||
    "";

  const bio =
    currentUser.user_metadata?.bio ||
    "वसुधैव कुटुम्बकम् परिवार का सदस्य";

  const work =
    currentUser.user_metadata?.work ||
    "";

  const education =
    currentUser.user_metadata?.education ||
    "";

  const website =
    currentUser.user_metadata?.website ||
    "";

  const location =
    currentUser.user_metadata?.location ||
    "";

  const newName =
    prompt("अपना नाम लिखें:", name);

  if(newName === null){
    return;
  }

  const newBio =
    prompt("अपना Bio लिखें:", bio);

  if(newBio === null){
    return;
  }

  const newWork =
    prompt("आपका Work / व्यवसाय:", work);

  if(newWork === null){
    return;
  }

  const newEducation =
    prompt("आपकी Education:", education);

  if(newEducation === null){
    return;
  }

  const newWebsite =
    prompt("Website:", website);

  if(newWebsite === null){
    return;
  }

  const newLocation =
    prompt(
      "Location (यदि share करना चाहते हैं):",
      location
    );

  if(newLocation === null){
    return;
  }

  updateEditedProfile(
    newName.trim(),
    newBio.trim(),
    newWork.trim(),
    newEducation.trim(),
    newWebsite.trim(),
    newLocation.trim()
  );

}


async function updateEditedProfile(
  name,
  bio,
  work,
  education,
  website,
  location
){

  try{

    const {
      data,
      error
    } =
    await supabaseClient
      .auth
      .updateUser({

        data:{
          display_name:name,
          bio:bio,
          work:work,
          education:education,
          website:website,
          location:location,
          avatar_url:
            currentUser
              .user_metadata
              ?.avatar_url || ""
        }

      });

    if(error){

      console.error(
        "Profile Update Error:",
        error
      );

      toast(
        "Profile Update Error: " +
        error.message
      );

      return;
    }

    currentUser =
      data.user;

    /* Update screen */

    const profileName =
      document.getElementById(
        "profileName"
      );

    const profileUsername =
      document.getElementById(
        "profileUsername"
      );

    const profileBio =
      document.getElementById(
        "profileBio"
      );

    const profileLocation =
      document.getElementById(
        "profileLocation"
      );

    const profileWork =
      document.getElementById(
        "profileWork"
      );

    const profileEducation =
      document.getElementById(
        "profileEducation"
      );

    const profileWebsite =
      document.getElementById(
        "profileWebsite"
      );

    if(profileName){
      profileName.innerText = name;
    }

    if(profileUsername){
      profileUsername.innerText =
        "@" + name;
    }

    if(profileBio){
      profileBio.innerText =
        bio ||
        "वसुधैव कुटुम्बकम् परिवार का सदस्य";
    }

    if(profileLocation){
      profileLocation.innerText =
        location || "Not shared";
    }

    if(profileWork){
      profileWork.innerText =
        work || "Not added";
    }

    if(profileEducation){
      profileEducation.innerText =
        education || "Not added";
    }

    if(profileWebsite){
      profileWebsite.innerText =
        website || "Not added";
    }

    /* Save profile table */

    await saveUserProfile();

    toast(
      "Profile अपडेट हो गई ✓"
    );

  }catch(error){

    console.error(error);

    toast(
      "Profile Error: " +
      error.message
    );

  }

}
