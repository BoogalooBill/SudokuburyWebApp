namespace SudokuburyWebApp.Server.Services
{
	public class DisposableEmailService
	{
		private readonly HashSet<string> _blockedDomains;
		private readonly ILogger<DisposableEmailService> _logger;

		public DisposableEmailService(IWebHostEnvironment env, ILogger<DisposableEmailService> logger)
		{
			_logger = logger;

			var filePath = Path.Combine(env.ContentRootPath, "Resources","disposable_email_blocklist.conf");

			if(!File.Exists(filePath))
			{
				_logger.LogWarning("Disposable email domains configuration file not found at {FilePath}. No domains will be blocked.", filePath);
				_blockedDomains = new HashSet<string>();
				return;
			}

			_blockedDomains = File.ReadAllLines(filePath)
					.Select(d => d.Trim().ToLower())
					.Where(d => !string.IsNullOrEmpty(d) && !d.StartsWith("#"))
					.ToHashSet();

			_logger.LogWarning("Loaded {Count} disposable email domains from configuration.", _blockedDomains.Count);
		}


		public bool IsDisposable(string email)
		{
			var domain = email.Split('@').LastOrDefault()?.ToLower();
			return domain != null && _blockedDomains.Contains(domain);
		}
	}
}