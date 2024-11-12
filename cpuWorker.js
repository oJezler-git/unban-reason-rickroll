// Prime number stress test (find primes up to a small number)
function primeStressTest() {
  const max = 9999999999999999999999999999;
  let primes = [];

  for (let i = 2; i < max; i++) {
    let isPrime = true;
    for (let j = 2; j <= Math.sqrt(i); j++) {
      if (i % j === 0) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) primes.push(i);
  }

  postMessage("done");
}

primeStressTest();
