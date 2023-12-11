<script>
  import ContactCard from "./ContactCard.svelte";

  let name = "Garrett";
  let age = 33;

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
<!-- <button on:click={changeName}>Change Name</button> -->
<input type="text" bind:value={name} on:input />
<ContactCard />

<style>
  h1 {
    color: purple;
  }
</style>
