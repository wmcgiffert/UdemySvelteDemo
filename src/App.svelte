<script>
  import ContactCard from "./ContactCard.svelte";

  let userName = "Garrett McG";
  let title = "Software Developer";
  let image =
    "https://resize.betalist.com/?dpr=2&fit=cover&format=auto&height=300&image=https%3A%2F%2Fcdn.betalist.com%2Fxuulgvf5hmtho0aent23szhnm9hj&signature=c0a1d28b02e9d47b8316a8750e97fbf025467e5e7f6801564cf7c5ec983aa67b";
  let description =
    "Stanfort Graduate with 10 years of software development experience with the Millie Mouse Company.";

  let displayed = false;
  let formState = true;

  function showContactInfo() {
    if (
      userName.trim().length === 0 ||
      title.trim().length === 0 ||
      image.trim().length === 0 ||
      description.trim().length === 0
    ) {
      formState = false;
      return;
    } else {
      formState = true;
    }
    if (displayed === false) {
      displayed = true;
    } else {
      displayed = false;
    }
  }
</script>

<div id="form">
  <div class="form-control">
    <label for="userName">User Name</label>
    <input type="text" bind:value={userName} id="userName" />
  </div>
  <div class="form-control">
    <label for="jobTitle">Job Title</label>
    <input type="text" bind:value={title} id="jobTitle" />
  </div>
  <div class="form-control">
    <label for="image">Image URL</label>
    <input type="text" bind:value={image} id="image" />
  </div>
  <div class="form-control">
    <label for="desc">Description</label>
    <textarea rows="3" bind:value={description} id="desc" />
  </div>
</div>

<button on:click={showContactInfo}>Add Contact Card</button>

{#if displayed && formState}
  <ContactCard
    {userName}
    jobTitle={title}
    bio={description}
    userImage={image}
  />
{:else if formState === false}
  <p>Invalid Input!</p>
{/if}

<style>
  #form {
    width: 30rem;
    max-width: 100%;
  }
</style>
