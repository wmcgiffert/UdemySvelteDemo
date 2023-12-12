<script>
  import ContactCard from "./ContactCard.svelte";

  let name = "Garrett";
  let title = "Software Developer";
  let image =
    "https://resize.betalist.com/?dpr=2&fit=cover&format=auto&height=300&image=https%3A%2F%2Fcdn.betalist.com%2Fxuulgvf5hmtho0aent23szhnm9hj&signature=c0a1d28b02e9d47b8316a8750e97fbf025467e5e7f6801564cf7c5ec983aa67b";
  let description =
    "Stanfort Graduate with 10 years of software development experince with the Millie Mouse Company.";
</script>

<div id="form">
  <div class="form-control">
    <label for="userName">User Name</label>
    <input type="text" bind:value={name} id="userName" />
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

<ContactCard userName={name} jobTitle={title} {description} userImage={image} />

<style>
  #form {
    width: 30rem;
    max-width: 100%;
  }
</style>
