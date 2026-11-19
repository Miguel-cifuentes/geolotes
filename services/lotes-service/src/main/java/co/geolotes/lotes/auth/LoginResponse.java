package co.geolotes.lotes.auth;

// expiraEn: milisegundos desde 1970 (lo mismo que Date.now() en el navegador)
public record LoginResponse(String token, String usuario, String nombre, long expiraEn) {}
