<script>
  import ContactCard from "./ContactCard.svelte";

  let name = "Garrett";
  let age = 33;
  let jobTitle = "Software Dev";
  let profPic = "https://resize.betalist.com/?dpr=2&fit=cover&format=auto&height=300&image=https%3A%2F%2Fcdn.betalist.com%2Fxuulgvf5hmtho0aent23szhnm9hj&signature=c0a1d28b02e9d47b8316a8750e97fbf025467e5e7f6801564cf7c5ec983aa67b";
  let jobDescription =
    "Fullstack engineer with 5 years experience and 5 years experience in public accounting. Graduated the University of Alabama (2014 & 2021) in Accounting and Management Information Systems. Also has a Master of Accountancy from Belmont University (2016)";

  $: upppercaseName = name.toUpperCase();
  $: console.log(name);

  $: if (name.toLocaleLowerCase() === "william") {
    age = 33;
  }

  function incrementAge() {
    age += 1;
  }

  function changeName() {
    name = "William";
  }
</script>

<h1>Hello I am {upppercaseName}, and I {age} years old!</h1>
<button on:click={incrementAge}>Change age</button>

<div>
  <span>Name: </span>
  <input type="text" bind:value={name} on:input />
</div>
<div>
  <span>Job Title: </span>
  <input type="text" bind:value={jobTitle} on:input />
</div>
<div>
  <span>Profile Picture URL: </span>
  <input type="text" bind:value={profPic} on:input />
</div>
<div>
  <span>Job Description: </span>
  <textarea rows="5" cols="50" bind:value={jobDescription}></textarea>
</div>

<ContactCard 
  userName={name} 
  {jobTitle} 
  {profPic} 
  {jobDescription} 
  />

<style>
  h1 {
    color: purple;
  }
  div {
    width: auto;
    display: flex;
    align-items: center;
  }
  span {
    margin: 1vh;
  }
</style>
