<script>
  export let userName = "William";
</script>

<div class="contact-card">
  <header>
    <div class="thumb">
      <img
        src="https://resize.betalist.com/?dpr=2&fit=cover&format=auto&height=300&image=https%3A%2F%2Fcdn.betalist.com%2Fxuulgvf5hmtho0aent23szhnm9hj&signature=c0a1d28b02e9d47b8316a8750e97fbf025467e5e7f6801564cf7c5ec983aa67b"
        alt="placeholder"
      />
    </div>
    <div class="user-data">
      <h1>{userName}</h1>
      <h2>Software Engineer</h2>
    </div>
  </header>
  <div class="description">
    <p>A short description</p>
  </div>
</div>

<style>
  .contact-card {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.26);
    max-width: 30rem;
    border-radius: 5px;
    margin: 1rem 0;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 8rem;
  }

  .thumb {
    width: 26%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    padding: 1rem;
    border-radius: 50%;
  }

  .user-data {
    width: 67%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin: 1rem;
  }

  h1 {
    font-size: 1.25rem;
    font-family: "Roboto Slab", sans-serif;
    margin: 0.5rem 0;
  }

  h2 {
    font-size: 1rem;
    font-weight: normal;
    color: #5a5a5a;
    margin: 0;
    margin-bottom: 0.5rem;
  }

  .description {
    border-top: 1px solid #ccc;
    padding: 1rem;
  }
</style>
